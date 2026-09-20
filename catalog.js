export const categories = [
  {name:'Fruits & vegetables',short:'Fresh produce',art:'vegetables',color:'#edf2dc'},
  {name:'Dairy & eggs',short:'Dairy & eggs',art:'milk',color:'#e8f1fa'},
  {name:'Bakery & breads',short:'Bakery & breads',art:'bread',color:'#f8ebdb'},
  {name:'Snacks & munchies',short:'Snacks & munchies',art:'chips',color:'#fce7dd'},
  {name:'Beverages',short:'Beverages',art:'juice',color:'#f3e8d9'},
  {name:'Staples & grains',short:'Staples & grains',art:'rice',color:'#f3edde'},
  {name:'Breakfast & spreads',short:'Breakfast & spreads',art:'honey',color:'#f8efcd'},
  {name:'Home & care',short:'Home & care',art:'soap',color:'#e9e8f6'}
];
const rows = [
 ['P001','Farm Fresh Bananas',0,'6 pieces (approx. 500 g)',48,60,'bananas','Fresh Pick','Naturally sweet, sunny-yellow bananas. A happy start to breakfast or an easy afternoon snack.'],
 ['P002','Fresh Toned Milk',1,'500 ml',28,30,'milk','Daily Essential','Smooth, fresh toned milk for your morning chai, cereal and everyday cooking. Keep refrigerated.'],
 ['P003','Whole Wheat Bread',2,'400 g',45,55,'bread','Baked Fresh','Soft slices with whole wheat goodness. Toast it, top it, or build your favourite sandwich.'],
 ['P004','Farm Fresh Eggs',1,'6 pieces',55,65,'eggs','Protein Pick','A breakfast essential. Carefully packed eggs, ready for a fluffy omelette or a simple boil.'],
 ['P005','Vine Tomatoes',0,'500 g',32,45,'tomatoes','Fresh Pick','Juicy, bright tomatoes for comforting curries, fresh salads and everything in between.'],
 ['P006','Classic Salted Chips',3,'100 g',40,50,'chips','Snack Time','Golden, crisp potato chips with a simple sprinkle of salt. Your movie-night companion.'],
 ['P007','Creamy Avocados',0,'2 pieces',129,160,'avocado','Fresh Pick','Creamy green avocados for toast, salads and homemade guacamole. Ripen at room temperature.'],
 ['P008','Fresh Orange Juice',4,'1 litre',110,140,'juice','No Added Sugar','Bright orange flavour in every sip. A refreshing companion to your breakfast.'],
 ['P009','Pure Golden Honey',6,'250 g',149,180,'honey','Pantry Favourite','A golden drizzle for warm toast, oats and tea. Store in a cool, dry place.'],
 ['P010','Premium Basmati Rice',5,'1 kg',120,150,'rice','Pantry Favourite','Long, fragrant grains that cook up fluffy. Perfect for everyday meals and weekend biryani.'],
 ['P011','Butter Croissants',2,'2 pieces',89,110,'croissant','Baked Fresh','Flaky layers with a buttery finish. Warm gently and enjoy with your favourite coffee.'],
 ['P012','Gentle Hand Wash',7,'250 ml',79,99,'soap','Home Essential','A gentle hand wash with a fresh botanical scent. A little everyday care for your home.'],
 ['P013','Crunchy Red Apples',0,'4 pieces',99,125,'apple','Fresh Pick','Crisp, juicy apples for lunchboxes, fruit bowls and that satisfying first bite.'],
 ['P014','Fresh Greek Yogurt',1,'200 g',60,75,'yogurt','Protein Pick','Thick, creamy plain yogurt. Pair with fruit or spoon into your favourite smoothie.'],
 ['P015','Chocolate Cookies',3,'150 g',65,80,'cookies','Snack Time','Golden cookies dotted with chocolate chips. Make teatime a little sweeter.'],
 ['P016','Rolled Oats',6,'500 g',95,120,'oats','Daily Essential','Hearty rolled oats for warm porridge, overnight oats and homemade granola.'],
 ['P017','Tender Carrots',0,'500 g',35,45,'carrots','Fresh Pick','Sweet, crunchy carrots for fresh salads, soups and easy snacking.'],
 ['P018','Everyday Atta',5,'1 kg',55,65,'atta','Pantry Favourite','Finely milled whole wheat flour for soft rotis and warm, home-cooked meals.'],
 ['P019','Leaf Green Tea',4,'25 tea bags',119,150,'tea','Pantry Favourite','A light, refreshing cup for your afternoon pause. Brew gently and enjoy.'],
 ['P020','Soft Facial Tissues',7,'100 pulls',59,75,'tissues','Home Essential','Soft, everyday tissues in a handy box for your desk or bedside.'],
 ['P021','Natural Peanut Butter',6,'200 g',135,160,'peanut','Protein Pick','Creamy roasted peanut spread for toast, smoothies and an extra tasty breakfast.'],
 ['P022','Garden Broccoli',0,'1 piece (approx. 250 g)',59,75,'broccoli','Fresh Pick','Green florets with a satisfying crunch. Steam, stir-fry or roast until tender.'],
 ['P023','Fresh Paneer',1,'200 g',90,105,'paneer','Protein Pick','Soft, fresh paneer for hearty curries, quick scrambles and grilled bites.'],
 ['P024','Sea Salt Popcorn',3,'70 g',45,60,'popcorn','Snack Time','Light, fluffy popcorn with a touch of sea salt. Ready when the movie starts.']
];
export const products = rows.map(([id,name,cat,unit,price,mrp,art,badge,description])=>({id,name,category:categories[cat].name,unit,price,mrp,art,badge,description,brand:'Freshlane'}));
export const productById = Object.fromEntries(products.map(p=>[p.id,p]));
