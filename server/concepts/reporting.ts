/**
 * This code uses OpenAI's API to perform moderation and content generation.
 * API Documentation: https://beta.openai.com/docs/
 * 
 * All moderation checks and content generation actions in this file
 * are performed using the OpenAI GPT models.
 * 
 * OpenAI, GPT-3, GPT-4, and associated models are trademarks of OpenAI.
 */
import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import OpenAI from "openai";
const openai = new OpenAI();

export interface ReportingDoc extends BaseDoc {
  item: ObjectId;
  reportedBy: ObjectId[];
  flaggingReason: string[];
  content: string;
}

export interface ReviewingDoc extends BaseDoc {
  item: ObjectId;
  reviewOutcome: "remove" | "approve";
}

/**
 * concept: Reporting[User, Item]
 */
export default class ReportingConcept {
  private readonly flaggedItems: DocCollection<ReportingDoc>;
  private readonly reviewedItems: DocCollection<ReviewingDoc>;

  /**
   * Make an instance of Reporting.
   */
  constructor(collectionName: string) {
    this.flaggedItems = new DocCollection<ReportingDoc>(collectionName + "_reports");
    this.reviewedItems = new DocCollection<ReviewingDoc>(collectionName + "_reviewed");
  }

  async flagItem(itemId: ObjectId, user: ObjectId, content: string, flaggingReason: string) {
    const report = await this.flaggedItems.readOne({ item: itemId });

    if (report) {
      // If already flagged, append the reporting user and reason
      if (!report.reportedBy.includes(user)) {
        report.reportedBy.push(user);
      }
      report.flaggingReason.push(flaggingReason);
      await this.flaggedItems.partialUpdateOne(
        { _id: report._id },
        {
          reportedBy: report.reportedBy,
          flaggingReason: report.flaggingReason,
        },
      );
    } else {
      // If this is the first time the item is being flagged
      await this.flaggedItems.createOne({
        item: itemId,
        reportedBy: [user],
        flaggingReason: [flaggingReason],
        content: content, // Store the content for moderation
      });
    }
    return { msg: "Content flagged for review." };
  }

  async reviewFlaggedItems() {
    const flaggedItems = await this.flaggedItems.readMany({});
    if (!flaggedItems.length) {
      return { msg: "No items found for review." };
    }

    for (const report of flaggedItems) {
      try {
        const moderationResponse = await openai.moderations.create({
          model: "omni-moderation-latest",
          input: report.content,
        });

        const moderationResult = moderationResponse.results[0];
        const outcome = moderationResult.flagged ? "remove" : "approve";

        // Store the review outcome in the reviewedItems collection
        await this.reviewedItems.createOne({
          item: report.item,
          reviewOutcome: outcome,
        });

        // Remove the item from the flagged list after review
        await this.flaggedItems.deleteOne({ item: report.item });
      } catch (error) {
        console.error(`Failed to review item ${report.item}:`, error);
      }
    }

    return { msg: "All flagged items reviewed successfully" };
  }

  async getReviewedItems() {
    return await this.reviewedItems.readMany({});
  }

  async getFlaggedItems() {
    return await this.flaggedItems.readMany({});
  }
}
