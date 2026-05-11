import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Copy, Lock, LockOpen, Trash2, Upload, Clock } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    filename: string;
    rawUrl: string;
  } | null>(null);

  // tRPC queries and mutations
  const { data: files, refetch: refetchFiles } = trpc.files.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: (data) => {
      setUploadedFile(data);
      toast.success(`تم وضع الملف: ${data.filename}`);
      refetchFiles();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في رفع الملف");
    },
  });

  const toggleSecurityMutation = trpc.files.toggleSecurity.useMutation({
    onSuccess: (data) => {
      if (data.isSecured) {
        toast.success("تم تأمين الملف");
      } else {
        toast.success("تم إلغاء تأمين الملف");
      }
      refetchFiles();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في تحديث حالة التأمين");
    },
  });

  const deleteMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الملف");
      refetchFiles();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في حذف الملف");
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const base64 = content.split(",")[1];

        await uploadMutation.mutateAsync({
          filename: file.name,
          content: base64,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("فشل في قراءة الملف");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ الرابط");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">FileHoster Pro</CardTitle>
            <CardDescription className="text-slate-400">
              استضافة احترافية للملفات والسكربتات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                تسجيل الدخول
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FileHoster Pro</h1>
          <p className="text-slate-400">
            استضافة احترافية وآمنة للملفات والسكربتات
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-700">
            <TabsTrigger value="upload" className="text-white">
              <Upload className="w-4 h-4 mr-2" />
              وضع ملف
            </TabsTrigger>
            <TabsTrigger value="history" className="text-white">
              <Clock className="w-4 h-4 mr-2" />
              السجل
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6 mt-6">
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">رفع ملف جديد</CardTitle>
                <CardDescription className="text-slate-400">
                  اختر ملفاً من جهازك لرفعه واستضافته
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                >
                  {uploadMutation.isPending ? "جاري الرفع..." : "وضع ملف"}
                </Button>
              </CardContent>
            </Card>

            {/* Uploaded File Info */}
            {uploadedFile && (
              <Card className="border-green-700 bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-green-400">تم رفع الملف بنجاح</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">اسم الملف:</p>
                    <p className="text-white font-mono text-lg">{uploadedFile.filename}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">رابط RAW:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={uploadedFile.rawUrl}
                        readOnly
                        className="flex-1 bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(uploadedFile.rawUrl)}
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-6">
            {!files || files.length === 0 ? (
              <Card className="border-slate-700 bg-slate-800">
                <CardContent className="py-8 text-center">
                  <p className="text-slate-400">لا توجد ملفات مرفوعة حتى الآن</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <Card key={file.id} className="border-slate-700 bg-slate-800">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-mono truncate">{file.filename}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(file.createdAt).toLocaleString("ar-SA")}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => copyToClipboard(file.rawUrl)}
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-white hover:bg-slate-700"
                            title="نسخ رابط RAW"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>

                          <Button
                            onClick={() =>
                              toggleSecurityMutation.mutate({ fileId: file.id })
                            }
                            disabled={toggleSecurityMutation.isPending}
                            variant="outline"
                            size="sm"
                            className={`border-slate-600 text-white hover:bg-slate-700 ${
                              file.isSecured ? "bg-yellow-900" : ""
                            }`}
                            title={
                              file.isSecured ? "إلغاء التأمين" : "تأمين الملف"
                            }
                          >
                            {file.isSecured ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <LockOpen className="w-4 h-4" />
                            )}
                          </Button>

                          <Button
                            onClick={() => deleteMutation.mutate({ fileId: file.id })}
                            disabled={deleteMutation.isPending}
                            variant="outline"
                            size="sm"
                            className="border-red-700 text-red-400 hover:bg-red-900"
                            title="حذف الملف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* File Status */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                          {file.isSecured ? "🔒 مؤمّن" : "🔓 غير مؤمّن"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {(file.fileSize / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
