angular.module('configServices', [])

.factory('Config', function() {
	configFactory = {};

	configFactory.invoiceTerms = [
		{name: 'On Receipt', days:0 },
    	{name: 'Within 15 Days (Net 15)', days:15},
      	{name: 'Within 30 Days (Net 30)', days:30},
      	{name: 'Within 45 Days (Net 45)', days:45},
      	{name: 'Within 60 Days (Net 60)', days:60},
      	{name: 'Within 90 Days (Net 90)', days:90}
    ];

  configFactory.GLAccountTypes = [
        {name: 'Accounts Payable'},
        {name: 'Accounts Receivable'},
        {name: 'Bank'},
        {name: 'Cost of Goods Sold'},
        {name: 'Deferred Expense'},
        {name: 'Deferred Revenue'},
        {name: 'Expense'},
        {name: 'Fixed Asset'},
        {name: 'Equity'},
        {name: 'Income'},
        {name: 'Long Term Liability'},
        {name: 'Other Asset'},
        {name: 'Other Current Asset'},
        {name: 'Other Current Liability'},
        {name: 'Other Expense'},
        {name: 'Other Income'} 
    ];

  // configFactory.PostingPeriods = [
  //       {name: 'Accounts Payable'},
  //       {name: 'Accounts Receivable'},
  //       {name: 'Bank'},
  //       {name: 'Cost of Goods Sold'},
  //       {name: 'Deferred Expense'},
  //       {name: 'Deferred Revenue'},
  //       {name: 'Expense'},
  //       {name: 'Fixed Asset'},
  //       {name: 'Equity'},
  //       {name: 'Income'},
  //       {name: 'Long Term Liability'},
  //       {name: 'Other Asset'},
  //       {name: 'Other Current Asset'},
  //       {name: 'Other Current Liability'},
  //       {name: 'Other Expense'},
  //       {name: 'Other Income'} 
  //   ];

	configFactory.title = 'The Matrix';

	return configFactory;
})