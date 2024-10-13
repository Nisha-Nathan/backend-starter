/**
 * This code uses OpenAI's API to generate encouraging and positive notification texts.
 * API Documentation: https://beta.openai.com/docs/
 * 
 * The notification content generated for users is powered by OpenAI's GPT model.
 * OpenAI, GPT-3, GPT-4, and associated models are trademarks of OpenAI.
 */
import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";
import OpenAI from "openai";
const openai = new OpenAI();

export interface NotificationDoc extends BaseDoc {
  user: ObjectId;
  notifyAbout: string;
  notificationTime: Date;
  status: "delivered" | "pending";
  notificationContent: string;
}

/**
 * concept: Notification [User]
 */
export default class NotificationConcept {
  public readonly notifications: DocCollection<NotificationDoc>;

  constructor(collectionName: string) {
    this.notifications = new DocCollection<NotificationDoc>(collectionName);
  }

  async createNotification(user: ObjectId, notifyAbout: string, notificationTime: Date) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a positive and  helpful and empathetic person",
        },
        {
          role: "user",
          content: `Notify user in a positive and warm manner about ${notifyAbout}. Notification:`,
        },
      ],
    });
    const currentTime = new Date();
    if (!notificationTime || notificationTime <= currentTime) {
      throw new NotAllowedError("Notification time must be in the future");
    }

    const notificationContent = completion.choices[0].message.content || notifyAbout;
    const _id = await this.notifications.createOne({ user, notifyAbout, notificationTime, status: "pending", notificationContent });
    return await this.notifications.readOne({_id})
  }

  async deliverPendingNotifications() {
    const currentTime = new Date();
    const pendingNotifications = await this.notifications.readMany({ status: "pending" });

    for (const notification of pendingNotifications) {
      if (notification.notificationTime <= currentTime) {
        // Update status to 'delivered'
        await this.notifications.partialUpdateOne({ _id: notification._id }, { status: "delivered" });
      }
    }

    return { msg: "Pending notifications delivered successfully!" };
  }

  async deleteNotification(_id: ObjectId) {
    const notification = await this.notifications.deleteOne({ _id });
    return { msg: "Notification deleted successfully!", notification };
  }

  async getDeliveredNotifications() {
    return await this.notifications.readMany({ status: "delivered" });
  }

  async getPendingNotiifications(){
    return await this.notifications.readMany({ status: "pending" });
  }
}
