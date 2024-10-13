import AuthenticatingConcept from "./concepts/authenticating";
import FriendingConcept from "./concepts/friending";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";
import ReactionConcept from "./concepts/reaction";
import FeedConcept from "./concepts/feed";
import NotificationConcept from "./concepts/notification";
import ReportingConcept from "./concepts/reporting";
// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const Reaction = new ReactionConcept("reactions");
export const Feed = new FeedConcept("feeds");
export const Notification = new NotificationConcept("notifications");
export const Reporting = new ReportingConcept("reports");
