export abstract  class NotificationBase {

  recepient: string;
  message:string;

  constructor(recepient: string, message: string){
    this.recepient = recepient;
    this.message=message;
  }
  abstract send(): Promise<void>;
}