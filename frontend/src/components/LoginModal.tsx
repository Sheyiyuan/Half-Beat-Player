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
    const [isExpired, setIsExpired] = useState(false);

    const generateQR = async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            setIsExpired(false);

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

        const pollInterval = setInterval(async () => {
            try {
                const result = await Services.PollLogin(key);

                if (result.loggedIn) {
                    clearInterval(pollInterval);
                    setIsPolling(false);
                    setTimeout(() => {
                        onLoginSuccess();
                        onClose();
                    }, 500);
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
            setIsExpired(true);
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
            title="B站二维码登录"
            centered
            size="sm"
            closeOnEscape={true}
            closeOnClickOutside={true}
        >
            <Stack gap="md">
                {errorMessage && (
                    <Alert color="red" title="错误">
                        {errorMessage}
                    </Alert>
                )}

                {qrUrl ? (
                    <div style={{ textAlign: "center" }}>
                        {/* 二维码容器，过期时添加模糊效果 */}
                        <div
                            style={{
                                position: "relative",
                                display: "inline-block",
                                width: "100%",
                            }}
                        >
                            <img
                                src={qrUrl}
                                alt="二维码"
                                style={{
                                    maxWidth: "100%",
                                    height: "auto",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    filter: isExpired ? "blur(8px)" : "none",
                                    opacity: isExpired ? 0.6 : 1,
                                    transition: "all 0.3s ease",
                                }}
                            />
                            {/* 过期时显示刷新按钮覆盖在二维码上 */}
                            {isExpired && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                    }}
                                >
                                    <Button
                                        onClick={generateQR}
                                        loading={isLoading}
                                        size="md"
                                    >
                                        点击刷新
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Text size="sm" c="dimmed" mt="md">
                            请使用 B站 APP 扫描二维码
                        </Text>
                    </div>
                ) : (
                    <Group justify="center">
                        <Loader size="lg" />
                    </Group>
                )}
            </Stack>
        </Modal>
    );
}
