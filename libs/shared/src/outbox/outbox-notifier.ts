export interface OutboxNotifier {
  notify(): Promise<void>
}
