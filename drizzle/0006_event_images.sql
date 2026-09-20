-- Event slideshows: image URL lists per opportunity
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS images text[];

UPDATE opportunities SET images = ARRAY['/events/food_parcel_packing/im1.jpeg']
  WHERE title = 'Saturday food parcel packing' AND images IS NULL;
UPDATE opportunities SET images = ARRAY['/events/el_hamiz_park_cleanup/im1.jpeg']
  WHERE title = 'El Hamiz park cleanup + replanting' AND images IS NULL;
UPDATE opportunities SET images = ARRAY['/events/faculty_of_sciences_cleaning/im1.jpeg','/events/faculty_of_sciences_cleaning/im2.jpeg']
  WHERE title = 'Faculty of Sciences courtyard cleanup' AND images IS NULL;
UPDATE opportunities SET images = ARRAY['/events/sablette_beach_cleanup/im1.jpeg','/events/sablette_beach_cleanup/im2.jpg']
  WHERE title = 'Sablettes beach cleanup' AND images IS NULL;
