module.exports = {
  token: '123456',
  services: [
    { name: 'Lifx', fileName: 'lifx' },
    { name: 'Roku', fileName: 'roku' }
  ],
  hooks: [
    { name: 'Express', fileName: 'server' }
  ],
  triggers: [
    { name: 'Network Scanner', fileName: 'network-scanner' }
  ]
}