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
    };
    push: {
        enabled: boolean;
        provider: string;
        endpoint: string;
        apiKey: string;
        firebaseProjectId: string;
        firebaseClientEmail: string;
        firebasePrivateKey: string;
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
    };
    push: {
        enabled: boolean;
        provider: string;
        endpoint: string;
        apiKey: string;
        firebaseProjectId: string;
        firebaseClientEmail: string;
        firebasePrivateKey: string;
    };
}>;
