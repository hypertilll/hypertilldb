import expect from '@hypertill/db_expect'

global.Buffer = class FakeBuffer {}
if (!global.process) {
  global.process = {}
}
if (!global.process.version) {
  // $FlowFixMe
  global.process.version = 'bla'
}

global.expect = expect
