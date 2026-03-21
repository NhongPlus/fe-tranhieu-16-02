import { useState } from "react";
import { 
  Button, Modal, Table, Loader, Center, Text, ScrollArea, Badge 
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendar } from "@tabler/icons-react";
import { getEvents } from "../api/event"; // Import hàm từ file event.ts

export default function ViewSchedule() {
  const [opened, { open, close }] = useDisclosure(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    open();
    setLoading(true);
    setError(null);
    try {
      const response = await getEvents();
      console.log('response', response)
      // Đảm bảo lấy đúng mảng dữ liệu từ response
      setEvents(Array.isArray(response.data.data) ? response.data.data : []);
      console.log("events", events);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Không thể tải lịch học. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="light" 
        fullWidth 
        leftSection={<IconCalendar size={16} />} 
        onClick={fetchEvents}
      >
        Lịch học
      </Button>

      <Modal 
        opened={opened} 
        onClose={close} 
        title="Thông tin lịch học" 
        size="xl" 
        centered
      >
        {loading ? (
          <Center py="xl"><Loader size="md" /></Center>
        ) : error ? (
          <Text c="red" ta="center">{error}</Text>
        ) : events.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">Chưa có lịch học nào được tạo.</Text>
        ) : (
          <ScrollArea h={450}>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tên môn</Table.Th>
                  <Table.Th>Phòng</Table.Th>
                  <Table.Th>Giảng viên</Table.Th>
                  <Table.Th>Thứ</Table.Th>
                  <Table.Th>Ca học</Table.Th>
                  <Table.Th>Tiết</Table.Th>
                  <Table.Th>Ngày BD - KT</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {events.map((item, index) => (
                  <Table.Tr key={item.id || index}>
                    <Table.Td fw={500}>{item.title}</Table.Td>
                    <Table.Td><Badge color="blue" variant="light">{item.room}</Badge></Table.Td>
                    <Table.Td>{item.teacher}</Table.Td>
                    <Table.Td>{item.day_of_week}</Table.Td>
                    <Table.Td>{item.session}</Table.Td>
                    <Table.Td>{item.period_start} - {item.period_end}</Table.Td>
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <Text size="xs">{new Date(item.start_date).toLocaleDateString("vi-VN")}</Text>
                      <Text size="xs" c="dimmed">{new Date(item.end_date).toLocaleDateString("vi-VN")}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Modal>
    </>
  );
}