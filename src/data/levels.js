// Game content: difficulties, power-ups, the six towns and their weeks, special lawns, shop items, achievements.

export const DIFFS={
  relaxed:{name:'Relaxed',desc:'Two minutes of daylight, softer wind, fewer leaves falling, more acorns.',secs:120,wind:0.65,gustGap:1.4,fall:0.6,power:1.4,pine:0.5,rival:0.8},
  standard:{name:'Standard',desc:'Ninety seconds of daylight. Gusts and falling leaves as intended.',secs:90,wind:1,gustGap:1,fall:1,power:1,pine:1,rival:1},
  hard:{name:'Hard',desc:'Seventy-five seconds, stronger and more frequent gusts, more pinecones.',secs:75,wind:1.3,gustGap:0.8,fall:1.3,power:0.8,pine:1.6,rival:1.2}
};

export const POWERS={
  T:{name:'Big tarp',dur:7,good:true},
  R:{name:'Wide rake',dur:8,good:true},
  S:{name:'Sun stop',dur:6,good:true},
  P:{name:'Sticky pitch',dur:6,good:false}
};

// Each town is a five-day week. Every day adds leaves, falling rate and wind, sunset comes a day later on the calendar,
// and the town's own hazard escalates.
export const DAY_NAMES=['Monday','Tuesday','Wednesday','Thursday','Friday'];

export const DAY_DESC={
  vt:['A calm evening under one sugar maple.','More leaves came down overnight.','The neighbor’s maple drops on your lawn too.','A heavy leaf drop after a cold night.','Wind advisory: stronger, more frequent gusts.'],
  nh:['Flurries arrive mid-evening.','Snow starts a little earlier.','Steady snow, piling up faster.','Heavy snow from early on.','Whiteout: snow from the start, burying everything fast.'],
  me:['Two fog banks roll in.','Thicker fog.','Thick fog, and the beam turns slower.','Three fog banks.','Pea soup: dense fog all evening and a slow beam.'],
  ma:['A few early trick-or-treaters.','More kids out.','The neighborhood is busy.','A costume parade: kids come thick and fast.','Halloween night. Kids from the first minute.'],
  ct:['A straight wall with two gaps.','A walled pen around the tarp, with one gate in.','An L-shaped wall.','One gap, far to the right.','Two walls with gaps at opposite ends.'],
  ri:['A steady sea breeze.','The breeze picks up.','Erosion: the cliff edge is closer.','A stiff offshore wind.','Gale: a strong breeze and the cliff closer still.']
};

export function dayParams(lv,d){
  const i=d-1, P={leafMul:1+0.08*i,fall:1+0.1*i,wind:1+0.06*i,gustGap:1-0.05*i,trees:lv.trees||1,
    snowStart:0.15,snowRate:1,fogBase:0.15,fogPeak:0.72,fogBanks:[[0.22,0.12],[0.62,0.15]],beamPeriod:6.5,
    kidStart:0.12,kidGap:1,walls:1,breeze:60,cliff:0,rival:d===4&&!lv.boss};
  if(lv.id==='vt'){if(d>=3) P.trees=2; if(d===5){P.wind*=1.35; P.gustGap*=0.75;}}
  if(lv.id==='nh'){P.snowStart=0.15-0.035*i; P.snowRate=1+0.3*i;}
  if(lv.id==='me'){P.fogBase=0.15+0.07*i; P.fogPeak=0.72+0.04*i; P.beamPeriod=6.5+0.8*i; if(d>=4) P.fogBanks=[[0.17,0.1],[0.44,0.12],[0.74,0.14]];}
  if(lv.id==='ma'){P.kidStart=Math.max(0.02,0.12-0.025*i); P.kidGap=1-0.13*i;}
  if(lv.id==='ct') P.walls=[1,4,3,2,5][i];
  if(lv.id==='ri'){P.breeze=55+12*i; P.cliff=10*i;}
  return P;
}

export const UPGRADES={
  rake:{name:'Wider rake',desc:'+8% rake width per level',cost:[400,1200,3000]},
  tarp:{name:'Bigger tarp',desc:'+10% tarp size per level',cost:[400,1200,3000]},
  power:{name:'Longer power-ups',desc:'Acorn power-ups last 20% longer per level',cost:[300,900,2200]},
  luck:{name:'Acorn luck',desc:'More acorns and fewer pinecones per level',cost:[300,900,2200]}
};

export const TARPS={
  blue:{name:'Classic blue',fill:'#2f62a3',edge:'#5d8fd0',price:0},
  green:{name:'Forest green',fill:'#2f6b46',edge:'#5f9c72',price:250},
  red:{name:'Barn red',fill:'#8e2c24',edge:'#c25a4c',price:250},
  orange:{name:'Safety orange',fill:'#d4661c',edge:'#f39a52',price:400},
  plaid:{name:'Buffalo plaid',fill:'#a3221f',edge:'#1c1c1c',price:0,milestone:5000}
};

export const RAKES={
  ash:{name:'Ash',c:'#9a7347',price:0},
  cherry:{name:'Cherry red',c:'#b8322a',price:150},
  black:{name:'Black',c:'#2b2622',price:150},
  gold:{name:'Gold',c:'#d9a92e',price:0,milestone:12000},
  silver:{name:'Moonlit silver',c:'#c9d3df',price:0,prize:90}
};

export const COMPOST=[[2000,'A compost heap starts behind the shed'],[5000,'Unlocks the buffalo plaid tarp'],[12000,'Unlocks the gold rake handle'],[25000,'The compost grows a pumpkin patch']];

// Leaf colors: red, red-orange, orange, amber, yellow, brown. Each lawn weights them to its trees.
export const LEVELS={
  vt:{id:'vt',town:'Stowe',state:'Vermont',lat:44.4654,lon:-72.6874,
    desc:'Golden hour under a sugar maple. Gentle gusts.',
    wind:1,gustEvery:[10,17],snow:false,
    leafWeights:[0.26,0.24,0.2,0.14,0.09,0.07],
    tree:['#9a2a17','#b5341b','#c94c20','#dc6a28','#e58d31'],treeDark:'#7a2414',
    facts:['Mount Mansfield, Vermont’s highest peak at 4,393 feet, rises just west of town.',
      'Vermont makes more maple syrup than any other state, roughly half of the US total.',
      'Sugar maples turn orange and red because cool, sunny autumn days make them produce red pigments called anthocyanins.'],
    finds:[{id:'mitten',e:'🧤',name:'Wool mitten',fact:'Lost on the first cold evening of the season, like every year.'},
      {id:'cowbell',e:'🔔',name:'Cowbell',fact:'Dairy farming cleared and shaped much of Vermont’s open hillside.'},
      {id:'cap',e:'🧢',name:'Red Sox cap',fact:'Fenway Park, home of the Red Sox since 1912, is the oldest ballpark in Major League Baseball.'},
      {id:'quarter',e:'🪙',name:'2001 Vermont quarter',fact:'It shows Camel’s Hump behind sugar maples hung with sap buckets.'},
      {id:'creemee',e:'🍦',name:'Dropped maple creemee',fact:'Creemee is the Vermont word for soft serve, and maple is the classic flavor.'}]},
  nh:{id:'nh',town:'Jackson',state:'New Hampshire',lat:44.1442,lon:-71.1853,
    desc:'An early snowstorm rolls in off the Presidentials. Snow buries the leaves and the gusts hit hard.',
    wind:1.45,gustEvery:[7,12],snow:true,
    leafWeights:[0.05,0.1,0.2,0.3,0.25,0.1],
    tree:['#b9701f','#c98a1f','#d9a531','#e2b844','#cf7a26'],treeDark:'#8a5a17',
    facts:['Mount Washington, the highest peak in the Northeast at 6,288 feet, stands just north of Jackson.',
      'In 1934 its summit observatory measured a 231 mph gust, a world record that stood for 62 years.',
      'Birches and beeches turn yellow when chlorophyll breaks down and reveals carotenoids that were in the leaf all summer.'],
    finds:[{id:'boot',e:'🥾',name:'Hiking boot',fact:'The Appalachian Trail crosses the Presidential Range above treeline.'},
      {id:'scarf',e:'🧣',name:'Striped scarf',fact:'Snow has fallen on Mount Washington in every month of the year.'},
      {id:'map',e:'🗺️',name:'Presidential Range trail map',fact:'The range’s peaks are named for presidents: Washington, Adams, Jefferson, Madison, Monroe and more.'},
      {id:'nhq',e:'🪙',name:'2000 New Hampshire quarter',fact:'It shows the Old Man of the Mountain, a granite profile that collapsed in 2003.'},
      {id:'cup',e:'☕',name:'Thermos cup',fact:'The Mount Washington Observatory has kept weather records on the summit since 1932.'}]},
  me:{id:'me',town:'Bass Harbor',state:'Maine',lat:44.2219,lon:-68.3373,
    desc:'A lawn in the woods of Acadia on Mount Desert Island. Two trees’ worth of leaves, fog banks rolling in off the water, and a lighthouse beam that cuts through them.',
    wind:1.1,gustEvery:[9,15],snow:false,fog:true,trees:2,leafMul:1.45,
    leafWeights:[0.15,0.15,0.12,0.2,0.28,0.1],
    tree:['#c9a227','#e0b93a','#b5341b','#d9692a','#a8782a'],treeDark:'#6e5216',
    facts:['Acadia became the first national park east of the Mississippi in 1919, three years after it was set aside as a national monument.',
      'A 1947 fire burned much of the island’s east side. The birches and aspens that grew back give it extra yellow every fall.',
      'For much of fall and winter, Cadillac Mountain is the first place in the US to see the sunrise.'],
    finds:[{id:'bib',e:'🦞',name:'Lobster bib',fact:'Maine lands far more lobster than any other state.'},
      {id:'compass',e:'🧭',name:'Pocket compass',fact:'Bass Harbor Head Light has marked the entrance to Bass Harbor since 1858.'},
      {id:'berries',e:'🫐',name:'Pint of wild blueberries',fact:'Maine grows nearly all of the wild blueberries harvested in the US.'},
      {id:'meq',e:'🪙',name:'2003 Maine quarter',fact:'It shows Pemaquid Point Light and a schooner under sail.'},
      {id:'pack',e:'🎒',name:'Daypack',fact:'John D. Rockefeller Jr. paid for Acadia’s 45 miles of carriage roads, built between 1913 and 1940.'}]},
  ma:{id:'ma',town:'Salem',state:'Massachusetts',lat:42.5195,lon:-70.8967,
    desc:'Halloween evening in the Witch City. Trick-or-treaters head straight for your biggest pile. Rake over them to shoo them off.',
    wind:1,gustEvery:[11,17],snow:false,kids:true,
    leafWeights:[0.24,0.22,0.18,0.1,0.06,0.2],
    tree:['#8e2a16','#a8331a','#c4491f','#8a4a25','#d0682a'],treeDark:'#5e2412',
    facts:['Salem’s Haunted Happenings festival runs through the whole month of October.',
      'The witch trials of 1692 began in Salem Village, now the town of Danvers. Twenty people were executed.',
      'The House of the Seven Gables, built in 1668, gave Nathaniel Hawthorne the title of his 1851 novel.'],
    finds:[{id:'anchor',e:'⚓',name:'Brass anchor charm',fact:'Salem Maritime, set up in 1938 around the old wharves, was the first National Historic Site in the US.'},
      {id:'maq',e:'🪙',name:'2000 Massachusetts quarter',fact:'It shows the Minuteman statue from Concord over an outline of the state.'},
      {id:'book',e:'📕',name:'Copy of The Scarlet Letter',fact:'Hawthorne was born in Salem in 1804 and worked at its Custom House, which opens the novel.'},
      {id:'broom',e:'🧹',name:'Toy broomstick',fact:'Salem police cars carry a witch on a broomstick on their door emblem.'},
      {id:'pumpkin',e:'🎃',name:'Mini pumpkin',fact:'In Ireland, jack-o’-lanterns were carved from turnips. Immigrants to America switched to pumpkins.'}]},
  ct:{id:'ct',town:'Kent',state:'Connecticut',lat:41.7248,lon:-73.4773,
    desc:'An old hillside farm in the Litchfield Hills, split by a fieldstone wall. Leaves won’t go through stone, so work them along the wall and through the gaps.',
    wind:1,gustEvery:[10,16],snow:false,wall:true,leafMul:0.8,
    leafWeights:[0.22,0.22,0.22,0.12,0.08,0.14],
    tree:['#a8331a','#c4491f','#d9692a','#e58d31','#8a4a25'],treeDark:'#6e2614',
    facts:['Farmers clearing rocky fields in the 1700s and 1800s built stone walls all over New England, by some estimates more than 100,000 miles of them.',
      'The Appalachian Trail runs right through Kent, along the Housatonic River.',
      'Kent Falls drops about 250 feet in a series of cascades on its way to the Housatonic.'],
    finds:[{id:'ctq',e:'🪙',name:'1999 Connecticut quarter',fact:'It shows the Charter Oak, where legend says the colony hid its royal charter in 1687.'},
      {id:'apizza',e:'🍕',name:'Slice of white clam pizza',fact:'New Haven’s thin, coal-fired pizza is called apizza, and the white clam pie is its signature.'},
      {id:'whale',e:'🐋',name:'Toy whale',fact:'The sperm whale is Connecticut’s state animal, a nod to its whaling ports like Mystic and New London.'},
      {id:'twain',e:'📘',name:'Copy of Tom Sawyer',fact:'Mark Twain wrote The Adventures of Tom Sawyer while living in Hartford.'},
      {id:'hat',e:'🎩',name:'Top hat',fact:'Danbury was once the center of American hat making, nicknamed Hat City.'}]},
  ri:{id:'ri',town:'Newport',state:'Rhode Island',lat:41.4901,lon:-71.3128,
    desc:'A mansion lawn above the Cliff Walk. A steady sea breeze pushes leaves toward the cliff, and any that blow over the edge are lost to the Atlantic.',
    wind:1.1,gustEvery:[9,14],snow:false,sea:true,
    leafWeights:[0.18,0.2,0.18,0.18,0.12,0.14],
    tree:['#b5341b','#c94c20','#dc6a28','#e2b844','#8a4a25'],treeDark:'#6e2a14',
    facts:['Rhode Island is the smallest state, about 48 miles from north to south.',
      'The Cliff Walk runs about 3.5 miles along Newport’s shore, between the Gilded Age mansions and the Atlantic.',
      'The Breakers, finished for the Vanderbilts in 1895, has 70 rooms.'],
    finds:[{id:'coffeemilk',e:'🥛',name:'Glass of coffee milk',fact:'Coffee milk is Rhode Island’s official state drink.'},
      {id:'riq',e:'🪙',name:'2001 Rhode Island quarter',fact:'It shows a sailboat on Narragansett Bay with the Pell Bridge behind it.'},
      {id:'chicken',e:'🐓',name:'Rubber chicken',fact:'The Rhode Island Red, a breed developed in the state in the 1800s, is the official state bird.'},
      {id:'tennis',e:'🎾',name:'Tennis ball',fact:'The Newport Casino hosted the first US national tennis championships in 1881. It now houses the Tennis Hall of Fame.'},
      {id:'sailboat',e:'⛵',name:'Model sailboat',fact:'Newport hosted the America’s Cup races from 1930 to 1983.'}]}
};

export const BOSS={id:'ne',town:'The Nor’easter',state:'Gulf of Maine',lat:43.66,lon:-70.26,boss:true,
  desc:'The season’s last storm is coming ashore. Rake the leaves it throws at you onto the tarp to fill bags, then flick the bags up at the storm. Twelve hits break it.',
  wind:1.3,gustEvery:[6,10],snow:false,
  leafWeights:[0.2,0.2,0.2,0.15,0.1,0.15],
  tree:['#9a2a17','#c94c20','#e58d31','#d9a531','#8a4a25'],treeDark:'#5e2412',
  facts:['A nor’easter is a coastal storm named for its strongest winds, which blow in from the northeast.',
    'The Blizzard of 1978, a nor’easter, buried Boston under more than 27 inches of snow.'],
  leafMul:0.6,finds:[],special:true};

export const MOOSE={id:'mo',town:'Greenville',state:'Maine',lat:45.4598,lon:-69.5906,special:true,moose:true,
  desc:'A lawn on Moosehead Lake, and a bull moose who loves your leaf piles. He tramples whatever he walks through and now and then charges the tarp. Fill bags and flick them at him: five hits and he heads back into the woods for good.',
  wind:1,gustEvery:[10,16],snow:false,trees:2,leafMul:1.1,
  leafWeights:[0.14,0.18,0.2,0.22,0.16,0.1],
  tree:['#b5341b','#d9692a','#e2b844','#c98a1f','#8a4a25'],treeDark:'#5e3a16',
  facts:['Maine has more moose than any other state outside Alaska.',
    'Moosehead Lake, at Greenville, is the largest lake in Maine.',
    'A bull moose’s antlers can span more than five feet, and he grows a new set every year.'],
  finds:[]};

export const NIGHT={...LEVELS.vt,id:'nt',town:'Stowe by moonlight',special:true,night:true,
  desc:'Your prize for three stars on every lawn: the Stowe lawn after dark under a full moon. Your rake carries a lantern; everything else is in shadow.',
  facts:['The full moon nearest the autumn equinox is called the harvest moon.'],finds:[]};

export const SPECIAL={ne:BOSS,mo:MOOSE,nt:NIGHT};

export const levelOf=id=>LEVELS[id]||SPECIAL[id]||null;

export const PLACES=[
  {id:'vt'},{id:'nh'},{id:'me'},{id:'ma'},{id:'ri'},{id:'ct'}
].map(p=>LEVELS[p.id]?{...LEVELS[p.id],level:true}:p);

export const KID_COSTUMES=['👻','🧙','🧛','🧟','🦇'];

export const LEAF_COLORS=[['#b5301c','#6e1a0f'],['#d24e1c','#862f12'],['#e5832a','#94501a'],['#efb13c','#9c6f1f'],['#d6c04a','#86782a'],['#8e4a25','#552b15']];

export const ACH={
  firstbag:{name:'First bag',desc:'Bag 100 leaves.'},
  monster:{name:'Monster pile',desc:'Dump a ×5 pile on the tarp.'},
  sun:{name:'Beat the sun',desc:'Clear a lawn before dusk.'},
  shoo:{name:'Shoo fly',desc:'Shoo 25 trick-or-treaters.'},
  fog:{name:'Fogbound',desc:'Get 3 stars in Bass Harbor.'},
  stone:{name:'Stone cold',desc:'Get 3 stars on a Kent Friday.'},
  seawall:{name:'Sea wall',desc:'Finish a Newport day losing fewer than 20 leaves.'},
  dale:{name:'Neighborhood champ',desc:'Beat Dale in all six towns.'},
  curator:{name:'Curator',desc:'Find all 30 things hidden under the leaves.'},
  storm:{name:'Storm chaser',desc:'Break the Nor’easter.'},
  snowman:{name:'Snow day',desc:'Send a snowman down the hill.'},
  million:{name:'Leaf mountain',desc:'Rake 50,000 leaves in all.'},
  moose:{name:'Moose on the loose',desc:'Drive the Greenville moose back into the woods.'},
  daily:{name:'Regular',desc:'Rake the daily lawn three days in a row.'},
  night:{name:'Night owl',desc:'Get 3 stars raking by moonlight.'},
  toss:{name:'Fair champion',desc:'Score 500 in bag toss.'}
};

// ---------- The Nor'easter: fill bags from the leaves it throws, flick them up at it. It brings sleet at 8 hits left
// and fog and lightning at 4.
export const BOSS_HP=12, BAG_LEAVES=60;

// ---------- The leaf vacuum: hold the nozzle down and leaves within reach are pulled in and bagged straight away, up to
// about sixty a second. A tally at the nozzle shows what it has bagged.
export const VAC_PRICE=800;

// ---------- Bag toss at the fair: cornhole with leaf bags. Flick a bag; how hard you flick sets the distance and the wind drifts it.
// Rings score 10, 25 or 50 (double in the bull's-eye); the pumpkin cart scores 100.
export const TOSS_SECS=60;

export const SM_TARGET={base:44,middle:31,head:21};
