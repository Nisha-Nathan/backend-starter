import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotFoundError } from "./errors";

export interface ReactionDoc extends BaseDoc {
  user: ObjectId;
  item: ObjectId;
  reaction: string;
}

const definedReactions = ["Hug", "Smile", "Cheer"];
/**
 * concept: Reaction [User]
 */
export default class ReactionConcept {
  public readonly reactions: DocCollection<ReactionDoc>;

  constructor(collectionName: string) {
    this.reactions = new DocCollection<ReactionDoc>(collectionName);
  }

  async addReaction(user: ObjectId, item: ObjectId, reaction: string) {
    this.assertReactionIsValid(reaction);
    const existingReaction = await this.reactions.readOne({ user, item });
    if (existingReaction) {
      await this.reactions.partialUpdateOne({ _id: existingReaction._id }, { reaction });
    } else {
      await this.reactions.createOne({ user, item, reaction });
    }
    const addedReaction = await this.reactions.readOne({ user, item });
    return { msg: "Reaction added!", reaction: addedReaction };
  }

  async removeReaction(user: ObjectId, item: ObjectId) {
    const reaction = await this.reactions.popOne({ user, item });
    if (reaction === null) {
      throw new ReactionNotFoundError(user, item);
    }
    return { msg: "Reaction removed!" };
  }

  async getReactionCount(itemId: ObjectId) {
    
    return await this.reactions.count({ item: itemId });
  }

  private assertReactionIsValid(reaction: string) {
    const isValid = definedReactions.some((r) => r.toLowerCase() === reaction.toLowerCase());
    if (!isValid) {
      throw new BadValuesError(`${reaction} is not Allowed`);
    }
  }
}

export class ReactionNotFoundError extends NotFoundError {
  constructor(
    public readonly user: ObjectId,
    public readonly item: ObjectId,
  ) {
    super("Reaction on {0} by {1} does not exist!", user, item);
  }
}
