import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import type { UserInfo } from '../../types';

interface UseLoginHandlersParams {
    closeModal: (name: string) => void;
    setUserInfo: (info: UserInfo | null) => void;
    setStatus: (msg: string) => void;
}

export const useLoginHandlers = ({ closeModal, setUserInfo, setStatus }: UseLoginHandlersParams) => {
    const handleLoginSuccess = useCallback(async () => {
        closeModal('loginModal');
        try {
            const info = await Services.GetUserInfo();
            setUserInfo(info);
            localStorage.setItem('tomorin.userInfo', JSON.stringify(info));
            setStatus(`已登录: ${info.username}`);
            notifications.show({
                title: '登录成功',
                message: `欢迎回来，${info.username}！`,
                color: 'green',
            });
        } catch (e) {
            console.error('获取用户信息失败:', e);
            setStatus('已登录');
        }
    }, [closeModal, setUserInfo, setStatus]);

    return { handleLoginSuccess } as const;
};
