Database.model('User', {

 properties: ['_someid', '_someother', 'first', 'last', {'nested': ['test']}]

});