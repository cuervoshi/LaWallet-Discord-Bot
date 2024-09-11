export class SimpleLock {
  constructor() {
    this.locked = false;
    this.queue = [];
  }

  acquire() {
    return new Promise((resolve) => {
      let released = false;

      const timeout = setTimeout(() => {
        if (!released) {
          released = true;
          this.release();
        }
      }, 5000);

      const release = () => {
        if (!released) {
          clearTimeout(timeout);
          released = true;
          this.release();
        }
      };

      if (!this.locked) {
        this.locked = true;
        resolve(release);
      } else {
        this.queue.push(() => {
          clearTimeout(timeout);
          released = true;
          resolve(release);
        });
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      nextResolve(() => this.release());
    } else {
      this.locked = false;
    }
  }
}
