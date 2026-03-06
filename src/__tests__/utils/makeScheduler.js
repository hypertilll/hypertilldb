// eslint-disable-next-line
import { TestScheduler } from 'rxjs/testing'

class HypertillTestScheduler extends TestScheduler {
  cold(marbles, values, error) {
    return this.createColdObservable(marbles, values, error)
  }

  hot(marbles, values, error) {
    return this.createHotObservable(marbles, values, error)
  }
}

export default function makeScheduler() {
  return new HypertillTestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })
}
