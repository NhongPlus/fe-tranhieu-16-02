import { Card, Stack, Text, Title, Group, ThemeIcon, Progress } from "@mantine/core";
import { IconCalendarEvent, IconClock, IconStar } from "@tabler/icons-react";

export default function OverviewPanel() {
  return (
    <Stack gap="md">
      <Title order={5} mb="xs">Tóm tắt tuần này</Title>

      <Card withBorder radius="md" padding="sm" shadow="xs">
        <Group>
          <ThemeIcon color="blue" variant="light" size="lg">
            <IconCalendarEvent size={20} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Tổng sự kiện</Text>
            <Text fw={700} size="xl">12</Text>
          </div>
        </Group>
      </Card>

      <Card withBorder radius="md" padding="sm" shadow="xs">
        <Group mb="xs">
          <ThemeIcon color="teal" variant="light" size="lg">
            <IconClock size={20} />
          </ThemeIcon>
          <div style={{ flex: 1 }}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Tiến độ tuần</Text>
            <Text fw={700} size="md">65% Hoàn thành</Text>
          </div>
        </Group>
        <Progress value={65} color="teal" size="sm" radius="xl" />
      </Card>

      <Card withBorder radius="md" padding="sm" bg="blue.7" c="white">
        <Stack gap={4}>
          <Group justify="space-between">
            <IconStar size={20} />
            <Text size="xs" fw={700}>MẸO NHỎ</Text>
          </Group>
          <Text size="sm" fw={500}>Đừng quên chuẩn bị tài liệu cho môn Triết học sáng mai nhé!</Text>
        </Stack>
      </Card>
    </Stack>
  );
}