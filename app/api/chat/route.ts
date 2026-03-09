import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/api-auth';
import { query, queryOne, getUserIdByEmail, createChat, getChats } from '@/lib/database-mysql';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { Product } from '@/types/product';
import { cookies } from 'next/headers';

export const runtime = 'nodejs'

// ✅ FIX: Sanitize message để tránh XSS
function sanitizeMessage(message: string): string {
  // Basic sanitization - remove HTML tags và script tags
  return message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

const messageSchema = z.object({
  receiverId: z.number().int().positive().optional(),
  message: z.string().min(1).max(5000),
});

/**
 * ✅ FIX: Verify user từ JWT hoặc localStorage user data
 * Thống nhất auth với login flow (không yêu cầu Firebase)
 */
async function verifyAuthUser(request: NextRequest): Promise<{ email: string; uid?: string } | null> {
  try {
    // Cách 1: JWT token trong cookie
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth-token') || cookieStore.get('next-auth.session-token');
    if (tokenCookie) {
      try {
        const jwt = await import('@/lib/jwt');
        const payload = await (jwt as any).verifyToken?.(tokenCookie.value);
        if (payload?.email) {
          return { email: payload.email, uid: payload.uid || payload.sub };
        }
      } catch { /* JWT verify failed, try other methods */ }
    }

    // Cách 2: Email từ query param hoặc header (cho client-side auth)
    const authEmail = request.headers.get('x-user-email');
    if (authEmail) {
      // Verify email exists in database
      const userId = await getUserIdByEmail(authEmail);
      if (userId) {
        return { email: authEmail, uid: String(userId) };
      }
    }

    // Cách 3: Firebase token (backward compatible)
    try {
      const { verifyFirebaseToken } = await import('@/lib/api-auth');
      const firebaseUser = await verifyFirebaseToken(request);
      if (firebaseUser?.email) return { email: firebaseUser.email, uid: firebaseUser.uid };
    } catch { /* Firebase not configured */ }

    return null;
  } catch (error) {
    logger.error('Auth verification error', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ FIX: Thêm rate limiting để tránh spam messages
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request, 10, 60, 'chat-post');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authUser = await verifyAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để sử dụng chat' }, { status: 401 });
    }

    const body = await request.json();

    // Validate với Zod
    const validation = messageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ'
      }, { status: 400 });
    }

    const { receiverId, message } = validation.data;

    // ✅ FIX: Sanitize message để tránh XSS
    const sanitizedMessage = sanitizeMessage(message);

    if (!sanitizedMessage || sanitizedMessage.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Message không được để trống sau khi sanitize'
      }, { status: 400 });
    }

    // Get sender user_id từ email
    const senderId = await getUserIdByEmail(authUser.email || '');

    if (!senderId) {
      return NextResponse.json({ success: false, error: 'User not found in database' }, { status: 404 });
    }

    // ✅ Check nếu sender là admin - kiểm tra cả admin table và users.role
    const adminCheck = await query<any>(
      `SELECT a.id 
       FROM admin a
       WHERE a.user_id = ?
       UNION
       SELECT u.id
       FROM users u
       WHERE u.id = ? AND u.role = 'admin'`,
      [senderId, senderId]
    );

    const isAdmin = adminCheck.length > 0;

    // Determine receiver và admin_id
    let userId: number = senderId; // ✅ FIX: Initialize với senderId
    let adminId: number | null = null;

    if (isAdmin) {
      // Admin gửi cho user cụ thể
      if (!receiverId) {
        return NextResponse.json({ success: false, error: 'Receiver ID required for admin messages' }, { status: 400 });
      }
      userId = receiverId;
      adminId = senderId;
    } else {
      // User gửi cho admin → tìm admin user_id
      try {
        const adminResult = await query<any>(
          `(SELECT id as user_id FROM users WHERE role = 'admin' LIMIT 1)
           UNION ALL
           (SELECT user_id as user_id FROM admin WHERE user_id IS NOT NULL LIMIT 1)
           LIMIT 1`
        );

        if (adminResult.length > 0) {
          adminId = adminResult[0].user_id;
        } else {
          // ✅ FIX: Nếu không tìm thấy admin, vẫn cho phép gửi tin nhắn (adminId = null)
          // Tin nhắn sẽ được lưu và admin có thể xem sau
          logger.warn('Admin not found, allowing message with adminId = null', { senderId });
          adminId = null;
        }
      } catch (adminQueryError) {
        logger.error('Error querying admin', adminQueryError, { senderId });
        // Vẫn cho phép gửi tin nhắn với adminId = null
        adminId = null;
      }
    }

    // Insert message vào bảng chats
    const result = await createChat({
      userId,
      adminId,
      message: sanitizedMessage, // ✅ Dùng sanitized message
      isAdmin,
    });

    // ✅ Gemini Auto-Reply - Chỉ khi user gửi tin nhắn (không phải admin)
    let autoReplyMessage: any = null;
    if (!isAdmin && process.env.GEMINI_API_KEY && process.env.ENABLE_AUTO_REPLY === 'true') {
      try {
        autoReplyMessage = await generateAutoReply(sanitizedMessage, userId);

        if (autoReplyMessage) {
          // Lưu auto-reply vào database — đánh dấu sender_type = 'ai'
          await createChat({
            userId,
            adminId,
            message: `🤖 ${autoReplyMessage}`,
            isAdmin: true, // Hiển thị bên trái (admin side)
          });
        }
      } catch (autoReplyError) {
        logger.warn('Auto-reply failed (non-critical)', {
          userId,
          error: autoReplyError instanceof Error ? autoReplyError.message : String(autoReplyError)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: {
        id: result.id,
        userId,
        adminId,
        message: sanitizedMessage,
        isAdmin,
        senderType: isAdmin ? 'admin' : 'user',
        createdAt: result.createdAt
      },
      ...(autoReplyMessage && {
        autoReply: {
          message: autoReplyMessage,
          senderType: 'ai'
        }
      })
    });
  } catch (error: any) {
    logger.error('Chat POST error', error, { endpoint: '/api/chat' });
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // ✅ FIX: Thêm rate limiting
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request, 30, 10, 'chat-get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authUser = await verifyAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để xem tin nhắn' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get current user_id
    const currentUserId = await getUserIdByEmail(authUser.email || '');

    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'User not found in database' }, { status: 404 });
    }

    // ✅ Check if admin - kiểm tra cả admin table và users.role
    const adminCheck = await query<any>(
      `SELECT a.id 
       FROM admin a
       WHERE a.user_id = ?
       UNION
       SELECT u.id
       FROM users u
       WHERE u.id = ? AND u.role = 'admin'`,
      [currentUserId, currentUserId]
    );
    const isAdmin = adminCheck.length > 0;

    // Get chats với pagination ở database level
    let chats;
    if (isAdmin) {
      // Admin có thể xem chat với user cụ thể hoặc tất cả
      if (userIdParam) {
        chats = await getChats(parseInt(userIdParam), currentUserId, limit, offset);
      } else {
        chats = await getChats(undefined, currentUserId, limit, offset);
      }
    } else {
      // User chỉ xem chat của mình với admin
      chats = await getChats(currentUserId, undefined, limit, offset);
    }

    // ✅ FIX: Thêm senderType cho client dễ phân biệt AI (bot) vs Admin vs User
    const paginatedChats = chats.map((chat: any) => {
      let senderType = 'user';
      let messageContent = chat.message || '';

      if (chat.is_admin) {
        if (messageContent.startsWith('🤖 ')) {
          senderType = 'ai';
          messageContent = messageContent.substring(2).trim(); // Remove icon
        } else {
          senderType = 'admin';
        }
      }

      return {
        ...chat,
        message: messageContent,
        senderType
      };
    });

    return NextResponse.json({
      success: true,
      messages: paginatedChats,
      pagination: {
        limit,
        offset,
        total: chats.length
      }
    });
  } catch (error: any) {
    logger.error('Chat GET error', error, { endpoint: '/api/chat' });
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * ✅ NEW: Generate auto-reply using Gemini AI
 */
async function generateAutoReply(userMessage: string, userId: number): Promise<string | null> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Lấy lịch sử chat gần đây để context
    const recentChats = await getChats(userId, undefined, 5, 0);
    const chatHistory = recentChats
      .slice(-5) // Lấy 5 tin nhắn gần nhất
      .map(chat => `${chat.is_admin ? 'Admin' : 'Khách hàng'}: ${chat.message}`)
      .join('\n');

    // ✅ NEW: Lấy thông tin sản phẩm phổ biến để AI có thể trả lời về sản phẩm
    const { getProducts } = await import('@/lib/database-mysql');
    const popularProducts = await getProducts({ isActive: true, limit: 5 });
    const productsList = popularProducts
      .map((p, i) => `${i + 1}. ${p.title} - ${p.price ? `${p.price.toLocaleString('vi-VN')}đ` : 'Liên hệ'}${p.category ? ` (${p.category})` : ''}`)
      .join('\n');

    // ✅ NEW: Tìm sản phẩm được đề cập trong câu hỏi
    const mentionedProduct = findMentionedProduct(userMessage, popularProducts);

    const prompt = `Bạn là trợ lý AI chuyên nghiệp của một website bán source code. Nhiệm vụ của bạn là trả lời câu hỏi của khách hàng một cách thân thiện, chuyên nghiệp và hữu ích.

Lịch sử chat gần đây:
${chatHistory || 'Chưa có lịch sử'}

${mentionedProduct ? `SẢN PHẨM ĐƯỢC ĐỀ CẬP:
- Tên: ${mentionedProduct.title}
- Mô tả: ${mentionedProduct.description || 'Chưa có mô tả'}
- Giá: ${mentionedProduct.price ? `${mentionedProduct.price.toLocaleString('vi-VN')}đ` : 'Liên hệ'}
- Danh mục: ${mentionedProduct.category || 'N/A'}
${mentionedProduct.demo_url ? `- Demo: ${mentionedProduct.demo_url}` : ''}

` : ''}SẢN PHẨM PHỔ BIẾN HIỆN CÓ:
${productsList || 'Chưa có sản phẩm'}

Câu hỏi hiện tại của khách hàng: "${userMessage}"

Yêu cầu:
- Trả lời bằng tiếng Việt
- Ngắn gọn, rõ ràng (tối đa 200 từ)
- Thân thiện, chuyên nghiệp
${mentionedProduct ? '- Nếu câu hỏi về sản phẩm được đề cập, hãy sử dụng thông tin sản phẩm ở trên để trả lời chính xác' : ''}
- Nếu khách hỏi về sản phẩm, hãy gợi ý từ danh sách sản phẩm phổ biến
- Nếu không chắc chắn, hãy đề nghị khách hàng liên hệ admin
- Không tự ý hứa hẹn về giá cả, thời gian giao hàng nếu không chắc chắn

Trả lời:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const reply = response.text().trim();

    // Sanitize reply
    const sanitizedReply = sanitizeMessage(reply);

    if (!sanitizedReply || sanitizedReply.length === 0) {
      return null;
    }

    logger.info('Auto-reply generated', { userId, messageLength: sanitizedReply.length });
    return sanitizedReply;
  } catch (error: any) {
    logger.error('Gemini auto-reply error', { userId, error: error.stack || error.message });
    if (error.message?.includes('429') || error.message?.includes('exceeded your current quota')) {
      return "Hệ thống AI đang xử lý quá nhiều yêu cầu cùng lúc. Vui lòng thử lại sau ít phút hoặc đợi Admin phản hồi nhé!";
    }
    return "Xin lỗi, AI Assistant đang bảo trì tạm thời. Vui lòng để lại lời nhắn cho Admin.";
  }
}

/**
 * ✅ NEW: Tìm sản phẩm được đề cập trong câu hỏi
 */
function findMentionedProduct(message: string, products: Product[]): Product | null {
  if (!products || products.length === 0) return null;

  const lowerMessage = message.toLowerCase();

  // Tìm sản phẩm có tên xuất hiện trong câu hỏi
  for (const product of products) {
    if (product.title) {
      const productTitle = product.title.toLowerCase();
      // Kiểm tra nếu tên sản phẩm hoặc từ khóa chính xuất hiện trong câu hỏi
      const titleWords = productTitle.split(/\s+/).filter((w: string) => w.length > 3);
      if (titleWords.some((word: string) => lowerMessage.includes(word)) || lowerMessage.includes(productTitle)) {
        return product;
      }
    }
  }

  return null;
}
