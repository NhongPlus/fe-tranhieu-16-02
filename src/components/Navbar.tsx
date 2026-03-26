import { ActionIcon, Anchor, Avatar, Button, Container, Group, Text, useMantineTheme } from "@mantine/core"
import { NavLink } from "react-router-dom";

import { Box } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconBell, IconSettings } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const isMdUp = useMediaQuery("(min-width: 48em)");
    const primaryContainer = theme.colors.orange?.[1] ?? "#ffefe8";
    const primary = theme.colors.orange?.[6] ?? "#a63300";
    return (
        <Box
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                borderBottom: `1px solid ${theme.colors.gray[2]}`,
                boxShadow: theme.shadows.sm,
            }}
        >
            <Container size="xl" style={{ height: 64, display: "flex", alignItems: "center" }}>
                <Group justify="space-between" style={{ width: "100%" }}>
                    <Group gap={48} style={{ alignItems: "center" }}>
                        <Text
                            style={{
                                fontSize: 26,
                                fontWeight: 800,
                                letterSpacing: "-0.02em",
                                color: theme.colors.orange[7],
                            }}
                        >
                            Scholarly
                        </Text>

                        {isMdUp && (
                            <Group gap={36}>
                                <NavLink to="/create-event" style={{ textDecoration: "none" }}>
                                    {({ isActive }) => (
                                        <Anchor
                                            underline="never"
                                            style={{
                                                color: isActive ? theme.colors.orange[7] : theme.colors.gray[7],
                                                fontWeight: isActive ? 700 : 600,
                                                paddingBottom: 4,
                                            }}
                                        >
                                            Tạo lich học
                                        </Anchor>
                                    )}
                                </NavLink>

                                <NavLink to="/transcript" style={{ textDecoration: "none" }}>
                                    {({ isActive }) => (
                                        <Anchor
                                            underline="never"
                                            style={{
                                                color: isActive ? theme.colors.orange[7] : theme.colors.gray[7],
                                                fontWeight: isActive ? 700 : 600,
                                                paddingBottom: 4,
                                            }}
                                        >
                                            Bảng điểm học tập
                                        </Anchor>
                                    )}
                                </NavLink>
                                <NavLink to="/gradeentry" style={{ textDecoration: "none" }}>
                                    {({ isActive }) => (
                                        <Anchor
                                            underline="never"
                                            style={{
                                                color: isActive ? theme.colors.orange[7] : theme.colors.gray[7],
                                                fontWeight: isActive ? 700 : 600,
                                                paddingBottom: 4,
                                            }}
                                        >
                                            Nhập điểm học phần 
                                        </Anchor>
                                    )}
                                </NavLink>
                                <NavLink to="/dashboard" style={{ textDecoration: "none" }}>
                                    {({ isActive }) => (
                                        <Anchor
                                            underline="never"
                                            style={{
                                                color: isActive ? theme.colors.orange[7] : theme.colors.gray[7],
                                                fontWeight: isActive ? 700 : 600,
                                                paddingBottom: 4,
                                            }}
                                        >
                                            Trang chủ
                                        </Anchor>
                                    )}
                                </NavLink>

                                <NavLink to="/gpa" style={{ textDecoration: "none" }}>
                                    {({ isActive }) => (
                                        <Anchor
                                            underline="never"
                                            style={{
                                                color: isActive ? theme.colors.orange[7] : theme.colors.gray[7],
                                                fontWeight: isActive ? 700 : 600,
                                                paddingBottom: 4,
                                            }}
                                        >
                                            GPA
                                        </Anchor>
                                    )}
                                </NavLink>
                            </Group>
                        )}
                    </Group>

                    <Group gap={16} style={{ alignItems: "center" }}>
                        <Group gap={12}>
                            <ActionIcon
                                variant="subtle"
                                size="lg"
                                radius="xl"
                                color={theme.colors.orange[6]}
                                styles={{ root: { border: `1px solid ${theme.colors.gray[2]}` } }}
                            >
                                <IconBell size={18} />
                            </ActionIcon>
                            <ActionIcon
                                variant="subtle"
                                size="lg"
                                radius="xl"
                                color={theme.colors.orange[6]}
                                styles={{ root: { border: `1px solid ${theme.colors.gray[2]}` } }}
                            >
                                <IconSettings size={18} />
                            </ActionIcon>
                        </Group>

                        <Button
                            radius="xl"
                            styles={{
                                root: {
                                    background: `linear-gradient(135deg, ${primary} 0%, ${theme.colors.orange[5]} 100%)`,
                                    color: theme.white,
                                    fontWeight: 700,
                                    boxShadow: theme.shadows.md,
                                },
                            }}
                        >
                            Nâng cấp
                        </Button>

                        <Avatar
                            radius="xl"
                            size={40}
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuApCz_Qu9f8mgIfzAkPbHRJXoV_Es_3PUsb45MVR4SFtsqB7fJtOKHZM0HHe75CCS8ElPckatJtDw3zZh1EH-4WMaGFFWcm2OzyyWMC-pIERAVS_Se_BVm6ZzUhrBViLApwSsbvvGXwrt2d-j0UMutL4Mal6PrVSaoCCnM4auPtbPt1Ok-t5AXCT8sl_k87DIlmlGAtv3bkQ6G015LPylwJlbi7luTHvWDel3oDghpHHHA9ftlUnXRuGVXJcVIdFyaqBomy6blnNxo"
                            alt="Ảnh đại diện sinh viên"
                            styles={{ root: { border: `2px solid ${primaryContainer}` } }}
                        />
                    </Group>
                </Group>
            </Container>
        </Box>
    )
}

export default Navbar;