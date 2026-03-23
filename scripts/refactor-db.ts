import { Project, SourceFile } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const project = new Project();
    const dbFilePath = path.join(__dirname, "../lib/database.ts");
    const sourceFile = project.addSourceFileAtPath(dbFilePath);

    const outDir = path.join(__dirname, "../lib/db");
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    // Helper map to categorize functions by domain
    const domains: Record<string, string[]> = {
        users: [
            "getUserById", "getUserByEmail", "createOrUpdateUser",
            "getUserIdByEmail", "updateBalance", "verifyEmail",
            "getReferrals", "createReferral", "normalizeUserId" // normalizeUserId could be core or users.
        ],
        products: [
            "getProducts", "getProductById", "createProduct",
            "updateProduct", "deleteProduct", "trackProductView",
            "searchProducts", "getBundles", "getBundleById",
            "getBundleWithProducts", "getProductViewCount", "createBanner"
        ],
        transactions: [
            "getPurchases", "createPurchase", "createBulkPurchase",
            "processReferralCommission", "getPendingDeposits",
            "createDeposit", "approveDeposit", "getWithdrawals",
            "createWithdrawal", "approveWithdrawal", "approveWithdrawalAndUpdateBalance"
        ],
        features: [
            "getReviews", "createReview", "updateReviewStatus",
            "getReviewsAdmin", "getProductAverageRating", "voteReview",
            "getWishlist", "addToWishlist", "removeFromWishlist",
            "isInWishlist", "getCoupons", "createCoupon",
            "applyCoupon", "trackDownload", "getDownloads", "getCouponByCode"
        ],
        admin: [
            "createAppSetting", "getAdminActions", "createAdminAction",
            "createNotification", "getNotifications", "getChats",
            "createChat", "getUserSubscription", "getSubscriptionDiscount", "trackAnalyticsEvent"
        ]
    };

    // Keep core configuration in lib/db/core.ts
    // For simplicity, we create a core.ts specifically with DB client and connection logic.
    const coreFile = project.createSourceFile(path.join(outDir, "core.ts"), "", { overwrite: true });

    // Extract all imports from original database.ts
    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
        coreFile.addImportDeclaration(imp.getStructure());
    }

    // Move everything that is NOT an exported function into core.ts first
    const stmts = sourceFile.getStatements();
    let coreNodes = [];
    
    // Some variables like isServerless, poolConfig are used by core, but maybe some features use it.
    // Actually, everything before the first specific function (like "getUserById") goes to core.ts
    
    // To be precise, let's copy all imports, top-level configs, interfaces, getPool, query, withTransaction
    // to core.ts.
    
    const coreFunctions = ["getPool", "getPoolInstance", "hasDownloadCountColumn", "createPool", "validateDatabaseConfig", "query", "queryOne", "withTransaction"];
    const allKnownFunctions = new Set([...Object.values(domains).flat(), ...coreFunctions]);
    
    for (const stmt of stmts) {
        let isDomainFunc = false;
        if (stmt.getKindName() === "FunctionDeclaration") {
            const funcName = (stmt as any).getName();
            if (funcName && allKnownFunctions.has(funcName) && !coreFunctions.includes(funcName)) {
                isDomainFunc = true;
            }
        } else if (stmt.getKindName() === "VariableStatement") {
            const decls = (stmt as any).getDeclarations();
             for (const decl of decls) {
                 const name = decl.getName();
                 if (allKnownFunctions.has(name) && !coreFunctions.includes(name)) {
                     isDomainFunc = true;
                     break;
                 }
             }
        }
        
        if (!isDomainFunc) {
            coreFile.addStatements(stmt.getText());
        }
    }
    
    coreFile.saveSync();

    // Now, create the domain files
    for (const [domainName, funcs] of Object.entries(domains)) {
        const domainFile = project.createSourceFile(path.join(outDir, `${domainName}.ts`), "", { overwrite: true });
        
        domainFile.addImportDeclaration({
            moduleSpecifier: "./core",
            namedImports: ["pool", "getPool", "query", "queryOne", "withTransaction", "getPoolInstance"]
        });
        
        // Find these functions in the original file and add them
        for (const funcName of funcs) {
            const funcDecl = sourceFile.getFunction(funcName);
            if (funcDecl) {
                // If it's a domain function but calls hasDownloadCountColumn, we need to import it if it's in core.
                // Wait, if it's not exported from core, we export it.
                domainFile.addStatements(funcDecl.getText());
            } else {
                // Could be an arrow function
                const varDecl = sourceFile.getVariableDeclaration(funcName);
                if (varDecl) {
                    domainFile.addStatements(varDecl.getVariableStatement()?.getText() || "");
                }
            }
        }
        
        // Add additional imports might be missing like normalizeUserId
        if (domainName !== 'users') {
            if (funcs.some(f => domainFile.getFullText().includes('normalizeUserId'))) {
                domainFile.addImportDeclaration({
                    moduleSpecifier: "./users",
                    namedImports: ["normalizeUserId"]
                });
            }
        }
        
        domainFile.saveSync();
    }
    
    // Modify core.ts to export internal functions that submodules need
    const coreFixFile = project.getSourceFile(path.join(outDir, "core.ts"));
    if (coreFixFile) {
        const hasDl = coreFixFile.getFunction("hasDownloadCountColumn");
        if (hasDl && !hasDl.isExported()) {
             hasDl.setIsExported(true);
        }
        coreFixFile.saveSync();
        
        // Let's make sure our domain files import hasDownloadCountColumn from core if used
        for (const domainName of Object.keys(domains)) {
            const dFile = project.getSourceFile(path.join(outDir, `${domainName}.ts`));
            if (dFile && dFile.getFullText().includes("hasDownloadCountColumn")) {
                const imp = dFile.getImportDeclaration("./core");
                if (imp) {
                    imp.addNamedImport("hasDownloadCountColumn");
                }
            }
            dFile?.saveSync();
        }
    }

    // Now build the new database.ts Facade
    const facadeFile = project.createSourceFile(path.join(__dirname, "../lib/database.ts.new"), "", { overwrite: true });
    facadeFile.addExportDeclaration({ moduleSpecifier: "./db/core" });
    for (const domainName of Object.keys(domains)) {
        facadeFile.addExportDeclaration({ moduleSpecifier: `./db/${domainName}` });
    }
    facadeFile.saveSync();

    console.log("Refactoring complete! New files in lib/db/. Backup database.ts remaining.");
}

main().catch(console.error);
