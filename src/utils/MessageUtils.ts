import { apiService } from '@/services/ApiService';

interface IResPushMsg {
  code: number;
  msg: string;
  data: {
    id: string;
  };
}
export class MessageUtils {
  async pushMsg(msg: string): Promise<IResPushMsg> {
    return apiService.pushMsg(msg);
  }
  async PushErrMsg(msg: string): Promise<IResPushMsg> {
    return apiService.pushErrMsg(msg);
  }
}

export const msgUtils = new MessageUtils();
