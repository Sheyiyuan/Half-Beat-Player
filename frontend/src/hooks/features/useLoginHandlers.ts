import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { UserInfo } from '../../types';
import type { ModalStates } from '../ui/useModalManager';

interface UseLoginHandlersParams {
    closeModal: (name: keyof ModalStates) => void;
    setUserInfo: (info: UserInfo | null) => void;
    setStatus: (msg: string) => void;
}

export const useLoginHandlers = ({ closeModal, setUserInfo, setStatus }: UseLoginHandlersParams) => {
    const handleLoginSuccess = useCallback(async () => {
        closeModal('loginModal');
        try {
            const info = await Services.GetUserInfo();
            const mappedInfo: UserInfo = {
                uid: info.uid || 0,
                username: info.username || '',
                face: info.face || '',
                level: info.level || 0,
                vipType: (info as any).vip_type || (info as any).vipType || 0,
            };
            setUserInfo(mappedInfo);
            localStorage.setItem('half-beat.userInfo', JSON.stringify(mappedInfo));
            setStatus(`已登录: ${mappedInfo.username}`);
            notifications.show({
                title: '登录成功',
                message: `欢迎回来，${mappedInfo.username}！`,
                color: 'green',
            });
        } catch (e) {
            console.error('获取用户信息失败:', e);
            setStatus('已登录');
        }
    }, [closeModal, setUserInfo, setStatus]);

    return { handleLoginSuccess } as const;
};
