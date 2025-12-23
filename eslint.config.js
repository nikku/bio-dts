import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

const files = {
  ignored: [
    'test/fixtures'
  ],
  test: [
    'test/**/*.js'
  ]
};

export default [
  {
    ignores: files.ignored
  },

  // all
  ...bpmnIoPlugin.configs.node,

  // test
  ...bpmnIoPlugin.configs.mocha.map(config => {

    return {
      ...config,
      files: files.test
    };
  })
];