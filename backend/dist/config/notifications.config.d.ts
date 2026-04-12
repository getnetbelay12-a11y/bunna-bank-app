export declare const notificationsConfig: (() => {
    sms: {
        enabled: boolean;
        provider: string;
        senderId: string;
        endpoint: string;
        apiKey: string;
    };
    email: {
        enabled: boolean;
        provider: string;
        sender: string;
        endpoint: string;
        apiKey: string;
        smtpHost: string;
        smtpPort: number;
        smtpSecure: boolean;
        smtpUser: string;
        smtpPass: string;
        testRecipient: string;
        forceTestRecipient: string;
        externalSourcePath: string;
    };
    push: {
        enabled: boolean;
        provider: string;
        endpoint: string;
        apiKey: string;
        iosSimulatorDevice: string;
        iosSimulatorBundleId: string;
        apnsTeamId: string;
        apnsKeyId: string;
        apnsBundleId: string;
        apnsPrivateKey: string;
        apnsUseSandbox: boolean;
        firebaseProjectId: string;
        firebaseClientEmail: string;
        firebasePrivateKey: string;
    };
    telegram: {
        enabled: boolean;
        botToken: string;
        apiBase: string;
        forceTestChatId: string;
        webhookSecret: string;
        externalSourcePath: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    sms: {
        enabled: boolean;
        provider: string;
        senderId: string;
        endpoint: string;
        apiKey: string;
    };
    email: {
        enabled: boolean;
        provider: string;
        sender: string;
        endpoint: string;
        apiKey: string;
        smtpHost: string;
        smtpPort: number;
        smtpSecure: boolean;
        smtpUser: string;
        smtpPass: string;
        testRecipient: string;
        forceTestRecipient: string;
        externalSourcePath: string;
    };
    push: {
        enabled: boolean;
        provider: string;
        endpoint: string;
        apiKey: string;
        iosSimulatorDevice: string;
        iosSimulatorBundleId: string;
        apnsTeamId: string;
        apnsKeyId: string;
        apnsBundleId: string;
        apnsPrivateKey: string;
        apnsUseSandbox: boolean;
        firebaseProjectId: string;
        firebaseClientEmail: string;
        firebasePrivateKey: string;
    };
    telegram: {
        enabled: boolean;
        botToken: string;
        apiBase: string;
        forceTestChatId: string;
        webhookSecret: string;
        externalSourcePath: string;
    };
}>;
