INSERT INTO provinces(code,name) VALUES ('PH-CAS','Camarines Sur') ON CONFLICT(name) DO NOTHING;
WITH p AS (SELECT id FROM provinces WHERE name='Camarines Sur')
INSERT INTO municipalities(province_id,name,kind)
SELECT p.id,v.name,v.kind FROM p CROSS JOIN (VALUES
('Baao','MUNICIPALITY'),('Balatan','MUNICIPALITY'),('Bato','MUNICIPALITY'),('Bombon','MUNICIPALITY'),('Buhi','MUNICIPALITY'),('Bula','MUNICIPALITY'),('Cabusao','MUNICIPALITY'),('Calabanga','MUNICIPALITY'),('Camaligan','MUNICIPALITY'),('Canaman','MUNICIPALITY'),('Caramoan','MUNICIPALITY'),('Del Gallego','MUNICIPALITY'),('Gainza','MUNICIPALITY'),('Garchitorena','MUNICIPALITY'),('Goa','MUNICIPALITY'),('Lagonoy','MUNICIPALITY'),('Libmanan','MUNICIPALITY'),('Lupi','MUNICIPALITY'),('Magarao','MUNICIPALITY'),('Milaor','MUNICIPALITY'),('Minalabac','MUNICIPALITY'),('Nabua','MUNICIPALITY'),('Ocampo','MUNICIPALITY'),('Pamplona','MUNICIPALITY'),('Pasacao','MUNICIPALITY'),('Pili','MUNICIPALITY'),('Presentacion','MUNICIPALITY'),('Ragay','MUNICIPALITY'),('Sagñay','MUNICIPALITY'),('San Fernando','MUNICIPALITY'),('San Jose','MUNICIPALITY'),('Sipocot','MUNICIPALITY'),('Siruma','MUNICIPALITY'),('Tigaon','MUNICIPALITY'),('Tinambac','MUNICIPALITY'),('Iriga City','COMPONENT_CITY')
) AS v(name,kind) ON CONFLICT(province_id,name) DO NOTHING;

INSERT INTO municipalities(province_id,name,kind) VALUES (NULL,'Naga City','INDEPENDENT_CITY') ON CONFLICT DO NOTHING;
