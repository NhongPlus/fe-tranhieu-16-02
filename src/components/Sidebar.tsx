import { Stack, NavLink, Button, Divider, Text } from "@mantine/core";
import { useNavigate, useLocation } from "react-router-dom";
import { IconLayoutDashboard, IconCalendarPlus } from "@tabler/icons-react";
import ViewSchedule from "../page/ViewSchedule";

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Stack h="100%" justify="space-between">
            <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="md">Menu chính</Text>
                
                <NavLink
                    label="Bảng điều khiển"
                    leftSection={<IconLayoutDashboard size={20} stroke={1.5} />}
                    active={location.pathname === "/dashboard"}
                    onClick={() => navigate("/dashboard")}
                    variant="filled"
                />

                <NavLink
                    label="Thêm lịch học"
                    leftSection={<IconCalendarPlus size={20} stroke={1.5} />}
                    onClick={() => navigate("/create-event")}
                />

                <Divider my="sm" label="Học tập" labelPosition="center" />

                <ViewSchedule /> {/* Component này trả về nút Lịch học đã có của bạn */}

            </Stack>

            <Button variant="subtle" color="red" fullWidth onClick={() => {
                localStorage.clear();
                navigate("/login");
            }}>
                Đăng xuất
            </Button>
        </Stack>
    );
}