import { AppShell, Burger, Group, Title, useMantineTheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import OverviewPanel from "../components/OverviewPanel";

export default function Dashboard() {
  const [opened, { toggle }] = useDisclosure();
  const theme = useMantineTheme();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }}
      aside={{ width: 320, breakpoint: "md", collapsed: { desktop: false, mobile: true } }}
      padding="md"
      styles={{
        main: { backgroundColor: theme.colors.gray[0] }, // Tạo nền hơi xám để nổi bật các Card trắng
      }}
    >
      <AppShell.Header p="md">
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3} c="blue.7">StudyMind AI 🤖</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main display="flex" style={{ flexDirection: "column" }}>
        {/* ChatPanel sẽ chiếm toàn bộ không gian còn lại */}
        <ChatPanel />
      </AppShell.Main>

      <AppShell.Aside p="md" withBorder={false} bg="transparent">
        <OverviewPanel />
      </AppShell.Aside>
    </AppShell>
  );
}