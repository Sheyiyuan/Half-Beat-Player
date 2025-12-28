import React from "react";
import { Flex } from "@mantine/core";
import { TopBar } from "./TopBar";
import MainLayout from "./MainLayout";
import ControlsPanel from "./ControlsPanel";

interface AppPanelsProps {
    topBarProps: React.ComponentProps<typeof TopBar>;
    mainLayoutProps: React.ComponentProps<typeof MainLayout>;
    controlsPanelProps: React.ComponentProps<typeof ControlsPanel>;
}

const AppPanels: React.FC<AppPanelsProps> = ({ topBarProps, mainLayoutProps, controlsPanelProps }) => {
    return (
        <Flex direction="column" h="100%" gap="sm" p="sm" style={{ position: "relative", zIndex: 1, overflow: "hidden", backgroundColor: "transparent" }}>
            <TopBar {...topBarProps} />
            <MainLayout {...mainLayoutProps} />
            <ControlsPanel {...controlsPanelProps} />
        </Flex>
    );
};

export default AppPanels;
