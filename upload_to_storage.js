import { S3Storage } from "coze-coding-dev-sdk";
import { readFileSync } from "fs";

async function uploadProjectFile() {
  console.log('🚀 开始上传项目文件到对象存储...');

  // 初始化 S3Storage
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  try {
    // 读取项目压缩包
    const filePath = '/workspace/projects/k-gold-quote-system.tar.gz';
    console.log('📖 读取文件:', filePath);
    const fileContent = readFileSync(filePath);

    console.log('📦 文件大小:', (fileContent.length / 1024).toFixed(2), 'KB');

    // 上传到对象存储
    console.log('⬆️ 正在上传...');
    const fileKey = await storage.uploadFile({
      fileContent: fileContent,
      fileName: 'k-gold-quote-system.tar.gz',
      contentType: 'application/gzip',
    });

    console.log('✅ 上传成功! 文件 key:', fileKey);

    // 生成签名 URL（有效期 7 天）
    console.log('🔗 生成下载链接...');
    const downloadUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 7 * 24 * 3600, // 7 天
    });

    console.log('\n=================================');
    console.log('📥 下载链接（7 天内有效）:');
    console.log('=================================');
    console.log(downloadUrl);
    console.log('=================================\n');

    console.log('💡 使用说明:');
    console.log('1. 复制上面的链接到浏览器');
    console.log('2. 下载文件到你的电脑');
    console.log('3. 解压到: C:\\Users\\homem\\OneDrive\\Desktop\\BBB\\AI\\扣子\\数据备份');
    console.log('4. 然后拖拽文件到 GitHub 上传框\n');

  } catch (error) {
    console.error('❌ 上传失败:', error);
    throw error;
  }
}

uploadProjectFile();
