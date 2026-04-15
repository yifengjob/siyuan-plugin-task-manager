import { apiService } from '@/services/ApiService';

interface IResPushMsg {
  code: number;
  data: {
    id: string;
  };
  msg: string;
}
export class MessageUtils {
  async PushErrMsg(msg: string): Promise<IResPushMsg> {
    return apiService.pushErrMsg(msg);
  }
  async pushMsg(msg: string): Promise<IResPushMsg> {
    return apiService.pushMsg(msg);
  }
}

export const msgUtils = new MessageUtils();
