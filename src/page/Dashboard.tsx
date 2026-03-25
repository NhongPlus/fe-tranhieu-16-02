import { AppShell, Burger, Button, Group, Title, useMantineTheme, Text, Loader } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import OverviewPanel from "../components/OverviewPanel";
import { getTelegramStatus, unlinkTelegram } from "../api/telegram";

export default function Dashboard() {
  const [opened, { toggle }] = useDisclosure();
  const theme = useMantineTheme();

  const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [loadingTelegram, setLoadingTelegram] = useState(false);

  const loadTelegramStatus = async () => {
    setLoadingTelegram(true);
    try {
      const res = await getTelegramStatus();
      setTelegramLinked(Boolean(res.data?.is_telegram_linked));
      setTelegramLink(res.data?.telegram_link ?? null);
    } catch (error) {
      setTelegramLinked(false);
      setTelegramLink(null);
    } finally {
      setLoadingTelegram(false);
    }
  };

  useEffect(() => {
    loadTelegramStatus();
  }, []);

  const handleLinkTelegram = () => {
    if (!telegramLink) return;
    window.open(telegramLink, "_blank");

    // poll trạng thái 10 lần mỗi 3s, nếu liên kết true thì dừng ngay
    let tries = 0;
    const maxTries = 10;
    const intervalId = setInterval(async () => {
      tries += 1;
      try {
        const res = await getTelegramStatus();
        const linked = Boolean(res.data?.is_telegram_linked);
        const link = res.data?.telegram_link ?? null;
        setTelegramLinked(linked);
        setTelegramLink(link);

        if (linked || tries >= maxTries) {
          clearInterval(intervalId);
        }
      } catch {
        if (tries >= maxTries) {
          clearInterval(intervalId);
        }
      }
    }, 3000);
  };

  const handleUnlinkTelegram = async () => {
    setLoadingTelegram(true);
    try {
      await unlinkTelegram();
      await loadTelegramStatus();
    } catch {
      // bỏ qua, status giữ nguyên
    } finally {
      setLoadingTelegram(false);
    }
  };

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
        <Group h="100%" px="md" justify="space-between">
          <div>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3} c="blue.7">StudyMind AI 🤖</Title>
          </div>
          <Group spacing="xs">
            {loadingTelegram ? (
              <Loader size="xs" />
            ) : telegramLinked ? (
              <>
                <Text size="sm" c="teal">Đã liên kết Telegram</Text>
                <Button color="red" size="xs" onClick={handleUnlinkTelegram} loading={loadingTelegram}>
                  Unlink
                </Button>
              </>
            ) : (
              <Button
                color="blue"
                size="xs"
                onClick={handleLinkTelegram}
                disabled={!telegramLink || loadingTelegram}
              >
                {telegramLink ? "Liên kết Telegram" : "Chưa có link"}
              </Button>
            )}
          </Group>
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