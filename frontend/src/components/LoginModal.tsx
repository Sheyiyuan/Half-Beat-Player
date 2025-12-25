import React, { useEffect, useState } from "react";
import { Modal, Group, Button, Text, Stack, Loader, Alert } from "@mantine/core";
import QRCode from "qrcode";
import * as Services from "../../wailsjs/go/services/Service";

interface LoginModalProps {
    opened: boolean;
    onClose: () => void;
    onLoginSuccess: () => void;
}

export default function LoginModal({ opened, onClose, onLoginSuccess }: LoginModalProps) {
    const [qrUrl, setQrUrl] = useState<string>("");
    const [qrcodeKey, setQrcodeKey] = useState<string>("");
    const [expireAt, setExpireAt] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    const generateQR = async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            setStatusMessage("正在生成二维码...");

            const result = await Services.GenerateLoginQR();

            console.log("QR 生成结果:", result);

            if (result.url && result.qrcode_key) {
                // 使用 qrcode 库在本地生成二维码图片
                const qrDataUrl = await QRCode.toDataURL(result.url, {
                    width: 256,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                setQrUrl(qrDataUrl);
                setQrcodeKey(result.qrcode_key);
                setExpireAt(new Date(result.expire_at));
                setStatusMessage("请使用哔哩哔哩app扫描二维码登录");

                // 自动开始轮询
                startPolling(result.qrcode_key);
            } else {
                setErrorMessage("生成二维码失败，请稍后重试");
            }
        } catch (error: any) {
            setErrorMessage(error?.message || "生成二维码失败");
            console.error("生成二维码错误:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const startPolling = (key: string) => {
        setIsPolling(true);
        setStatusMessage("等待扫描...");

        const pollInterval = setInterval(async () => {
            try {
                const result = await Services.PollLogin(key);

                if (result.loggedIn) {
                    clearInterval(pollInterval);
                    setIsPolling(false);
                    setStatusMessage("登录成功！");
                    setTimeout(() => {
                        onLoginSuccess();
                        onClose();
                    }, 500);
                } else if (result.message) {
                    setStatusMessage(result.message);
                }
            } catch (error: any) {
                console.error("轮询登录状态错误:", error);
                clearInterval(pollInterval);
                setIsPolling(false);
            }
        }, 2000); // 每2秒轮询一次

        // 30秒后自动停止轮询
        setTimeout(() => {
            clearInterval(pollInterval);
            setIsPolling(false);
            if (!errorMessage) {
                setStatusMessage("二维码已过期，请重新生成");
            }
        }, 30000);
    };

    useEffect(() => {
        if (opened && !qrUrl) {
            generateQR();
        }
    }, [opened]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="哔哩哔哩登录"
            centered
            size="sm"
            closeOnEscape={!isPolling}
            closeOnClickOutside={!isPolling}
        >
            <Stack gap="md">
                {errorMessage && (
                    <Alert color="red" title="错误">
                        {errorMessage}
                    </Alert>
                )}

                {qrUrl ? (
                    <div style={{ textAlign: "center" }}>
                        <img
                            src={qrUrl}
                            alt="二维码"
                            style={{
                                maxWidth: "100%",
                                height: "auto",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                            }}
                        />
                        <Text size="sm" c="dimmed" mt="sm">
                            {statusMessage}
                        </Text>
                        {isPolling && (
                            <Group justify="center" mt="sm">
                                <Loader size="sm" />
                            </Group>
                        )}
                        {expireAt && !isPolling && (
                            <Text size="xs" c="dimmed" mt="sm">
                                二维码将在 {Math.max(0, Math.round((expireAt.getTime() - Date.now()) / 1000))} 秒后过期
                            </Text>
                        )}
                    </div>
                ) : (
                    <Group justify="center">
                        <Loader size="lg" />
                    </Group>
                )}

                <Group justify="flex-end">
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={isPolling}
                    >
                        关闭
                    </Button>
                    {(!isPolling || errorMessage) && (
                        <Button onClick={generateQR} loading={isLoading}>
                            {errorMessage ? "重新生成" : "刷新二维码"}
                        </Button>
                    )}
                </Group>
            </Stack>
        </Modal>
    );
}
