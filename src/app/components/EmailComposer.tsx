import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Send, Eye, Code, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

type EmailType = 'no website' | 'low seo' | 'website error';
type TimeFormat = '24h' | '12h';

export function EmailComposer() {
  const [id, setId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [offset, setOffset] = useState<number>(0);
  const [time, setTime] = useState<string>('09:00');
  const [emailType, setEmailType] = useState<EmailType>('no website');
  const [isSending, setIsSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [defaultWebhookUrl, setDefaultWebhookUrl] = useState('');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');

  // Generate UUID v4
  const generateUUID = () => {
    return crypto.randomUUID();
  };

  // Initialize UUID on mount
  useEffect(() => {
    setId(generateUUID());
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedWebhookUrl = localStorage.getItem('defaultWebhookUrl');
    if (savedWebhookUrl) {
      setDefaultWebhookUrl(savedWebhookUrl);
      setWebhookUrl(savedWebhookUrl);
    }

    const savedTimeFormat = localStorage.getItem('timeFormat') as TimeFormat;
    if (savedTimeFormat) {
      setTimeFormat(savedTimeFormat);
    }
  }, []);

  // Refresh UUID
  const handleRefreshId = () => {
    setId(generateUUID());
    toast.success('Đã tạo UUID mới!');
  };

  // Save settings to localStorage
  const handleSaveSettings = () => {
    localStorage.setItem('defaultWebhookUrl', defaultWebhookUrl);
    localStorage.setItem('timeFormat', timeFormat);
    setWebhookUrl(defaultWebhookUrl);
    setSettingsOpen(false);
    toast.success('Đã lưu cài đặt!');
  };

  // Convert time between formats
  const convertTimeFormat = (time: string, fromFormat: TimeFormat, toFormat: TimeFormat): string => {
    if (fromFormat === toFormat) return time;
    
    const [hours, minutes] = time.split(':').map(Number);
    
    if (toFormat === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    } else {
      // Converting from 12h to 24h
      const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let h = parseInt(match[1]);
        const m = match[2];
        const period = match[3].toUpperCase();
        
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        
        return `${h.toString().padStart(2, '0')}:${m}`;
      }
      return time;
    }
  };

  // Get normalized 24h time for sending
  const getNormalizedTime = (): string => {
    if (timeFormat === '24h') {
      return time;
    } else {
      return convertTimeFormat(time, '12h', '24h');
    }
  };

  // Auto-detect if content is HTML
  const isHTML = (text: string): boolean => {
    const htmlPattern = /<\/?[a-z][\s\S]*>/i;
    return htmlPattern.test(text);
  };

  const contentIsHTML = isHTML(content);

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Vui lòng nhập tiêu đề email');
      return;
    }

    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung email');
      return;
    }

    if (!webhookUrl.trim()) {
      toast.error('Vui lòng nhập URL webhook');
      return;
    }

    // Validate URL
    try {
      new URL(webhookUrl);
    } catch (error) {
      toast.error('Vui lòng nhập URL webhook hợp lệ');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          subject: subject,
          content: content,
          order: order,
          offset: offset,
          time: getNormalizedTime(),
          type: emailType,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('Gửi dữ liệu email thành công!');
        // Generate new UUID for next email
        setId(generateUUID());
        // Optionally clear the form
        // setSubject('');
        // setContent('');
      } else {
        toast.error(`Gửi thất bại: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      toast.error('Gửi dữ liệu email thất bại. Vui lòng kiểm tra lại URL webhook.');
      console.error('Error sending data:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-3xl font-bold">Soạn Email n8n</h1>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cài Đặt</DialogTitle>
                <DialogDescription>
                  Cấu hình các thông số mặc định cho phiên làm việc
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="default-webhook">URL Webhook Mặc Định</Label>
                  <Input
                    id="default-webhook"
                    type="url"
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    value={defaultWebhookUrl}
                    onChange={(e) => setDefaultWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL này sẽ được tự động điền vào trường webhook
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-format">Định Dạng Thời Gian</Label>
                  <Select value={timeFormat} onValueChange={(value) => setTimeFormat(value as TimeFormat)}>
                    <SelectTrigger id="time-format">
                      <SelectValue placeholder="Chọn định dạng thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 giờ</SelectItem>
                      <SelectItem value="12h">12 giờ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveSettings} className="w-full">
                  Lưu Cài Đặt
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          Soạn email của bạn bằng văn bản thuần hoặc HTML và gửi đến webhook n8n
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi Tiết Email</CardTitle>
          <CardDescription>
            Nhập tiêu đề và nội dung email. HTML sẽ được tự động phát hiện và hiển thị trước.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email ID */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="id">ID Email (UUID v4)</Label>
              <div className="flex gap-2">
                <Input
                  id="id"
                  type="text"
                  value={id}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshId}
                  title="Tạo UUID mới"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                UUID được tự động sinh và sẽ làm mới sau mỗi lần gửi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Thứ Tự Gửi</Label>
              <Input
                id="order"
                type="number"
                min="1"
                placeholder="1"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offset">Offset (phút)</Label>
              <Input
                id="offset"
                type="number"
                min="0"
                placeholder="0"
                value={offset}
                onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Khoảng cách thời gian với email trước đó
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Thời Gian Gửi</Label>
              {timeFormat === '24h' ? (
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="time"
                    type="text"
                    placeholder="09:00 AM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    pattern="(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM|am|pm)"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Thời gian gửi sau khi tính offset ({timeFormat === '24h' ? '24 giờ' : '12 giờ'})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Loại Email</Label>
              <Select value={emailType} onValueChange={(value) => setEmailType(value as EmailType)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Chọn loại email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no website">No Website</SelectItem>
                  <SelectItem value="low seo">Low SEO</SelectItem>
                  <SelectItem value="website error">Website Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Tiêu Đề Email</Label>
            <Input
              id="subject"
              placeholder="Nhập tiêu đề email..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Email Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Nội Dung Email</Label>
              {contentIsHTML && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Code className="size-3" />
                  Phát hiện HTML
                </span>
              )}
            </div>

            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Code className="size-4" />
                  Soạn Thảo
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  disabled={!contentIsHTML}
                  className="flex items-center gap-2"
                >
                  <Eye className="size-4" />
                  Xem Trước
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="mt-4">
                <Textarea
                  id="content"
                  placeholder="Nhập nội dung email tại đây... (hỗ trợ văn bản thuần hoặc HTML)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] font-mono"
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <Card className="min-h-[300px] overflow-auto">
                  <CardContent className="p-6">
                    {contentIsHTML ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: content }}
                        className="prose max-w-none"
                      />
                    ) : (
                      <p className="text-muted-foreground">Không có nội dung HTML để xem trước</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="webhook">URL Webhook n8n</Label>
            <Input
              id="webhook"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nhập URL webhook trigger n8n hoặc bất kỳ API endpoint nào
            </p>
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSend} 
            disabled={isSending}
            className="w-full"
            size="lg"
          >
            <Send className="size-4 mr-2" />
            {isSending ? 'Đang gửi...' : 'Gửi đến Webhook n8n'}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Cấu Trúc Payload</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Payload JSON sau sẽ được gửi đến webhook của bạn:
          </p>
          <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "id": "0ca463c9-c1f1-438a-9fa7-b7670186403d",
  "subject": "Your email subject",
  "content": "Your email content (plain or HTML)",
  "order": 1,
  "offset": 0,
  "time": "09:00",
  "type": "no website" | "low seo" | "website error",
  "timestamp": "2026-02-27T12:00:00.000Z"
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}