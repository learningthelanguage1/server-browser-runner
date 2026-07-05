export class TaskLock {
  private activeTaskId: string | null = null;

  acquire(taskId: string): boolean {
    if (this.activeTaskId) return false;
    this.activeTaskId = taskId;
    return true;
  }

  release(taskId: string): void {
    if (this.activeTaskId === taskId) this.activeTaskId = null;
  }

  current(): string | null {
    return this.activeTaskId;
  }
}
