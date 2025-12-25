import React from "react";
import { Button, Group, Modal, Select, Stack, Text, TextInput } from "@mantine/core";
import type { Favorite } from "../types";

type CreateFavMode = "blank" | "duplicate" | "importMine" | "importFid";

interface CreateFavoriteModalProps {
    opened: boolean;
    themeColor: string;
    favorites: Favorite[];
    createFavName: string;
    createFavMode: CreateFavMode;
    duplicateSourceId: string | null;
    importFid: string;
    onClose: () => void;
    onNameChange: (value: string) => void;
    onModeChange: (mode: CreateFavMode) => void;
    onDuplicateSourceChange: (id: string | null) => void;
    onImportFidChange: (value: string) => void;
    onSubmit: () => void;
}

const CreateFavoriteModal: React.FC<CreateFavoriteModalProps> = ({
    opened,
    themeColor,
    favorites,
    createFavName,
    createFavMode,
    duplicateSourceId,
    importFid,
    onClose,
    onNameChange,
    onModeChange,
    onDuplicateSourceChange,
    onImportFidChange,
    onSubmit,
}) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="新建歌单"
            centered
            size="md"
            overlayProps={{ blur: 10, opacity: 0.35 }}
        >
            <Stack gap="sm">
                <TextInput
                    label="歌单名称"
                    value={createFavName}
                    onChange={(e) => onNameChange(e.currentTarget.value)}
                    placeholder="输入歌单名"
                />
                <Select
                    label="创建方式"
                    data={[
                        { value: "blank", label: "新建空白歌单" },
                        { value: "duplicate", label: "复制已有歌单" },
                        { value: "importMine", label: "导入登录收藏夹 (需登录)" },
                        { value: "importFid", label: "通过 fid 导入公开收藏夹" },
                    ]}
                    value={createFavMode}
                    onChange={(val) => onModeChange((val as CreateFavMode) || "blank")}
                />
                {createFavMode === "duplicate" && (
                    <Select
                        label="选择要复制的歌单"
                        placeholder={favorites.length ? "选择歌单" : "暂无歌单"}
                        data={favorites.map((f) => ({ value: f.id, label: `${f.title} (${f.songIds.length} 首)` }))}
                        value={duplicateSourceId}
                        onChange={(val) => onDuplicateSourceChange(val)}
                        searchable
                        clearable
                    />
                )}
                {createFavMode === "importFid" && (
                    <TextInput
                        label="收藏夹 fid"
                        placeholder="输入 fid"
                        value={importFid}
                        onChange={(e) => onImportFidChange(e.currentTarget.value)}
                    />
                )}
                {createFavMode === "importMine" && (
                    <Text size="xs" c="dimmed">需要已登录 B 站账号。当前实现暂未接入后端接口。</Text>
                )}
                <Group justify="flex-end" mt="sm">
                    <Button variant="default" onClick={onClose}>取消</Button>
                    <Button color={themeColor} onClick={onSubmit}>确认</Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default CreateFavoriteModal;
