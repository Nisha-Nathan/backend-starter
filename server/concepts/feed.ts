import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FeedDoc extends BaseDoc {
  name: string;
  posts: ObjectId[];
}

/**
 * Concept: Feed [Post]
 */
export default class FeedConcept {
  public readonly feeds: DocCollection<FeedDoc>;

  constructor(collectionName: string) {
    this.feeds = new DocCollection<FeedDoc>(collectionName);
  }

  async createFeed(name: string) {
    this.assertFeednameUnique(name);
    const newFeed = await this.feeds.createOne({ name, posts: [] });
    return { msg: "Feed created!", feed: newFeed };
  }

  async addPostToFeed(_id: ObjectId, postId: ObjectId) {
    const feed = await this.feeds.readOne({ _id });
    if (!feed) {
      throw new NotFoundError(`Feed ${_id} does not exist!`);
    }

    const postIdString = postId.toString();
    const existingPostIds = feed.posts.map((post) => post.toString());

    if (existingPostIds.includes(postIdString)) {
      throw new NotAllowedError(`Post ${postId} already exists in feed ${_id}`);
    }
    feed.posts.push(postId);
    await this.feeds.partialUpdateOne({ _id }, { posts: feed.posts });
    return { msg: "Post added to feed!" };
  }

  async removePostFromFeed(_id: ObjectId, postId: ObjectId) {
    const feed = await this.feeds.readOne({ _id });
    if (!feed) {
      throw new NotFoundError(`Feed ${_id} does not exist!`);
    }

    const postIdString = postId.toString();
    const existingPostIds = feed.posts.map((post) => post.toString());

    if (!existingPostIds.includes(postIdString)) {
      throw new NotFoundError(`Post ${postId} does not exist in feed ${_id}`);
    }

    feed.posts = feed.posts.filter((post) => post.toString() !== postIdString);
    await this.feeds.partialUpdateOne({ _id }, { posts: feed.posts });
    const updatedFeed = await this.getFeedPosts(_id);
    return { msg: "Post removed from feed!", feed: updatedFeed };
  }

  async getFeedPosts(_id: ObjectId) {
    const feed = await this.feeds.readOne({ _id });
    if (!feed) {
      throw new Error("Feed not found!");
    }
    return feed;
  }

  async getFeeds() {
    return await this.feeds.readMany({});
  }

  private async assertFeednameUnique(name: string) {
    if (await this.feeds.readOne({ name })) {
      throw new NotAllowedError(`Feed with name ${name} already exists!`);
    }
  }
}
