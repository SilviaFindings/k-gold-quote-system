import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { appConfigManager } from '@/storage/database';

/**
 * GET /api/config - 获取所有配置
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await appConfigManager.getAllConfigs(user.id);

    // 转换为键值对格式
    const configMap: Record<string, any> = {};
    configs.forEach(config => {
      configMap[config.configKey] = config.configValue;
    });

    return NextResponse.json({ configs: configMap });
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/config - 设置配置
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const config = await appConfigManager.setConfig(user.id, key, value);

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Set config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
