import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiReviewService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string = 'Qwen/Qwen3-8B';

  constructor(private configService: ConfigService) {
    this.baseUrl = 'https://api.siliconflow.cn/v1';
    this.apiKey = 'sk-vxewhyhyjoguhupwiifbxxagyxtbncumkxyheeneibtpfkvs';
  }

  private generatePrompt(title: string, content: string): string {
    return `/no_think 请作为一个内容审核专家，对以下旅游日记进行审核。请仅从内容合规性的角度（包括但不限于暴力、色情、歧视、违法等）进行评估。
请以JSON格式回复，包含以下字段：
- approved: 布尔值，表示是否通过审核
- reason: 字符串，详细说明通过或拒绝的原因

待审核内容：
标题：${title}
内容：${content}

请严格按照以下JSON格式回复：
{
  "approved": true/false,
  "reason": "审核通过/拒绝的具体原因"
}`;
  }

  async reviewContent(title: string, content: string): Promise<{ approved: boolean; reason: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的内容审核专家，负责审核旅游日记内容是否合规。请只关注内容合规性，包括但不限于暴力、色情、歧视、违法等方面。'
            },
            {
              role: 'user',
              content: this.generatePrompt(title, content)
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000, // 设置为60秒超时
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      try {
        const result = JSON.parse(aiResponse);
        return {
          approved: result.approved,
          reason: result.reason
        };
      } catch (parseError) {
        throw new HttpException(
          '无法解析AI响应',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          'AI审核服务响应超时，请稍后重试',
          HttpStatus.REQUEST_TIMEOUT
        );
      }
      throw new HttpException(
        `AI审核服务调用失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 