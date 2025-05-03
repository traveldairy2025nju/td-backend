const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const rmdir = promisify(fs.rm);

async function cleanup() {
  try {
    console.log('开始清理不需要的文件和目录...');
    
    // 删除uploads目录 - 因为我们现在使用Minio存储文件
    console.log('删除uploads目录...');
    await rmdir(path.join(__dirname, 'uploads'), { recursive: true, force: true });
    
    // 删除dist目录中的uploads子目录（如果存在）
    const distUploadsPath = path.join(__dirname, 'dist', 'uploads');
    if (fs.existsSync(distUploadsPath)) {
      console.log('删除dist/uploads目录...');
      await rmdir(distUploadsPath, { recursive: true, force: true });
    }
    
    console.log('清理完成！');
  } catch (error) {
    console.error('清理过程中出错:', error);
  }
}

cleanup(); 