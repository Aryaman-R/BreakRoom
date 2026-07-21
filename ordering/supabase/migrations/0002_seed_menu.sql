-- Seed menu — real Breakroom items (representative subset with real prices
-- from breakroombothell.com/menu; the owner completes and corrects the rest
-- in /admin). Source: docs/ORDERING-DATABASE.md, applied verbatim.

-- Sandwiches (combos as add-ons; bread/cheese in notes)
insert into menu_items (name, price_cents, category, addons, notes_prompt, sort_order) values
 ('Grilled Cheese', 699,  'Sandwiches',
   '[{"label":"Combo: drink","price_cents":150},{"label":"Combo: drink & fries","price_cents":449}]',
   'Cheese: Swiss, cheddar, provolone, or American · Bread: wheat, sourdough, or white', 1),
 ('BLT', 1099, 'Sandwiches',
   '[{"label":"Combo: drink","price_cents":150},{"label":"Combo: drink & fries","price_cents":449}]',
   'Bread: wheat, sourdough, or white', 2),
 ('Turkey', 1099, 'Sandwiches',
   '[{"label":"Combo: drink","price_cents":150},{"label":"Combo: drink & fries","price_cents":449}]',
   'Bread: wheat, sourdough, or white', 3),
 ('Club', 1299, 'Sandwiches',
   '[{"label":"Combo: drink","price_cents":150},{"label":"Combo: drink & fries","price_cents":449}]',
   'Bread: wheat, sourdough, or white', 4);

-- Rice bowls (side picks in notes)
insert into menu_items (name, price_cents, category, notes_prompt, sort_order) values
 ('Chicken Curry Bowl',   1499, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 1),
 ('Orange Chicken Bowl',  1649, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 2),
 ('Chicken Katsu Bowl',   1699, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 3),
 ('Butter Chicken Bowl',  1699, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 4),
 ('Beef Bulgogi Bowl',    1749, 'Rice Bowls', 'Pick 2 sides: kimchi, green salad, japchae, mac salad', 5);

-- Wings & yakisoba (count / protein are price-setting variants)
insert into menu_items (name, price_cents, category, variants, notes_prompt, sort_order) values
 ('Fried Chicken Wings', 899, 'Wings & Yakisoba',
   '[{"label":"4 pc","price_cents":899},{"label":"8 pc","price_cents":1299},{"label":"12 pc","price_cents":1799}]',
   'Sauce: plain, BBQ, Korean, or sweet chili', 1),
 ('Yakisoba', 1399, 'Wings & Yakisoba',
   '[{"label":"Veggie","price_cents":1399}]',
   -- site lists $13.99–$16.99 by protein; add chicken/beef/shrimp/tofu/pork
   -- variants with exact prices in /admin.
   '', 2);

-- Burgers
insert into menu_items (name, price_cents, category, addons, sort_order) values
 ('Cheeseburger', 1099, 'Burgers',
   '[{"label":"Avocado","price_cents":100},{"label":"Bacon","price_cents":199}]', 1),
 ('Korean Chicken Burger', 1199, 'Burgers',
   '[{"label":"Avocado","price_cents":100},{"label":"Bacon","price_cents":199}]', 2),
 ('California Burger', 1299, 'Burgers',
   '[{"label":"Bacon","price_cents":199}]', 3);

-- Sides
insert into menu_items (name, price_cents, category, sort_order) values
 ('French Fries',      499, 'Sides', 1),
 ('Chicken Gyoza (6)', 599, 'Sides', 2),
 ('Pork Egg Roll',     299, 'Sides', 3);

-- Bubble tea (all $6.99; toppings are add-ons; sweetness/ice in notes)
insert into menu_items (name, price_cents, category, addons, notes_prompt, sort_order)
select name, 699, 'Bubble Tea',
 '[{"label":"Boba","price_cents":50},{"label":"Popping boba","price_cents":50},{"label":"Rainbow jelly","price_cents":50},{"label":"Lychee jelly","price_cents":50}]'::jsonb,
 'Sweetness & ice — e.g. 50% sweet, less ice', row_number() over ()
from unnest(array['Milk Tea','Taro','Thai Milk Tea','Matcha','Brown Sugar Milk','Mango Slush']) as name;

-- Coffee & espresso (12oz/16oz variants; alt milk add-on)
insert into menu_items (name, price_cents, category, variants, addons, sort_order) values
 ('Americano', 299, 'Coffee & Espresso',
   '[{"label":"12oz","price_cents":299},{"label":"16oz","price_cents":325}]',
   '[{"label":"Oat milk","price_cents":75},{"label":"Almond milk","price_cents":75}]', 1),
 ('Latte', 449, 'Coffee & Espresso',
   '[{"label":"12oz","price_cents":449},{"label":"16oz","price_cents":499}]',
   '[{"label":"Oat milk","price_cents":75},{"label":"Almond milk","price_cents":75}]', 2),
 ('Mocha', 499, 'Coffee & Espresso',
   '[{"label":"12oz","price_cents":499},{"label":"16oz","price_cents":549}]',
   '[{"label":"Oat milk","price_cents":75},{"label":"Almond milk","price_cents":75}]', 3),
 ('Chai Latte', 449, 'Coffee & Espresso',
   '[{"label":"12oz","price_cents":449},{"label":"16oz","price_cents":499}]',
   '[{"label":"Oat milk","price_cents":75},{"label":"Almond milk","price_cents":75}]', 4);

-- Tea
insert into menu_items (name, price_cents, category, sort_order) values
 ('Chamomile',     249, 'Tea', 1),
 ('Indian Masala', 399, 'Tea', 2);
