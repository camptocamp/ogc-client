import { CrsCode } from './models.js';

// All EPSG geographic 2D CRSs whose first axis is latitude (north),
// generated from the EPSG dataset v11.022 shipped with PROJ 9.5 (proj.db)
const LatLonCrsList = [
  'EPSG:3819', // HD1909
  'EPSG:3821', // TWD67
  'EPSG:3824', // TWD97
  'EPSG:3889', // IGRS
  'EPSG:3906', // MGI 1901
  'EPSG:4001', // Unknown datum based upon the Airy 1830 ellipsoid
  'EPSG:4002', // Unknown datum based upon the Airy Modified 1849 ellipsoid
  'EPSG:4003', // Unknown datum based upon the Australian National Spheroid
  'EPSG:4004', // Unknown datum based upon the Bessel 1841 ellipsoid
  'EPSG:4005', // Unknown datum based upon the Bessel Modified ellipsoid
  'EPSG:4006', // Unknown datum based upon the Bessel Namibia ellipsoid
  'EPSG:4007', // Unknown datum based upon the Clarke 1858 ellipsoid
  'EPSG:4008', // Unknown datum based upon the Clarke 1866 ellipsoid
  'EPSG:4009', // Unknown datum based upon the Clarke 1866 Michigan ellipsoid
  'EPSG:4010', // Unknown datum based upon the Clarke 1880 (Benoit) ellipsoid
  'EPSG:4011', // Unknown datum based upon the Clarke 1880 (IGN) ellipsoid
  'EPSG:4012', // Unknown datum based upon the Clarke 1880 (RGS) ellipsoid
  'EPSG:4013', // Unknown datum based upon the Clarke 1880 (Arc) ellipsoid
  'EPSG:4014', // Unknown datum based upon the Clarke 1880 (SGA 1922) ellipsoid
  'EPSG:4015', // Unknown datum based upon the Everest 1830 (1937 Adjustment) ellipsoid
  'EPSG:4016', // Unknown datum based upon the Everest 1830 (1967 Definition) ellipsoid
  'EPSG:4018', // Unknown datum based upon the Everest 1830 Modified ellipsoid
  'EPSG:4019', // Unknown datum based upon the GRS 1980 ellipsoid
  'EPSG:4020', // Unknown datum based upon the Helmert 1906 ellipsoid
  'EPSG:4021', // Unknown datum based upon the Indonesian National Spheroid
  'EPSG:4022', // Unknown datum based upon the International 1924 ellipsoid
  'EPSG:4023', // MOLDREF99
  'EPSG:4024', // Unknown datum based upon the Krassowsky 1940 ellipsoid
  'EPSG:4025', // Unknown datum based upon the NWL 9D ellipsoid
  'EPSG:4027', // Unknown datum based upon the Plessis 1817 ellipsoid
  'EPSG:4028', // Unknown datum based upon the Struve 1860 ellipsoid
  'EPSG:4029', // Unknown datum based upon the War Office ellipsoid
  'EPSG:4030', // Unknown datum based upon the WGS 84 ellipsoid
  'EPSG:4031', // Unknown datum based upon the GEM 10C ellipsoid
  'EPSG:4032', // Unknown datum based upon the OSU86F ellipsoid
  'EPSG:4033', // Unknown datum based upon the OSU91A ellipsoid
  'EPSG:4034', // Unknown datum based upon the Clarke 1880 ellipsoid
  'EPSG:4035', // Unknown datum based upon the Authalic Sphere
  'EPSG:4036', // Unknown datum based upon the GRS 1967 ellipsoid
  'EPSG:4041', // Unknown datum based upon the Average Terrestrial System 1977 ellipsoid
  'EPSG:4042', // Unknown datum based upon the Everest (1830 Definition) ellipsoid
  'EPSG:4043', // Unknown datum based upon the WGS 72 ellipsoid
  'EPSG:4044', // Unknown datum based upon the Everest 1830 (1962 Definition) ellipsoid
  'EPSG:4045', // Unknown datum based upon the Everest 1830 (1975 Definition) ellipsoid
  'EPSG:4046', // RGRDC 2005
  'EPSG:4047', // Unspecified datum based upon the GRS 1980 Authalic Sphere
  'EPSG:4052', // Unspecified datum based upon the Clarke 1866 Authalic Sphere
  'EPSG:4053', // Unspecified datum based upon the International 1924 Authalic Sphere
  'EPSG:4054', // Unspecified datum based upon the Hughes 1980 ellipsoid
  'EPSG:4055', // Popular Visualisation CRS
  'EPSG:4075', // SREF98
  'EPSG:4081', // REGCAN95
  'EPSG:4120', // Greek
  'EPSG:4121', // GGRS87
  'EPSG:4122', // ATS77
  'EPSG:4123', // KKJ
  'EPSG:4124', // RT90
  'EPSG:4125', // Samboja
  'EPSG:4126', // LKS94 (ETRS89)
  'EPSG:4127', // Tete
  'EPSG:4128', // Madzansua
  'EPSG:4129', // Observatario
  'EPSG:4130', // Moznet
  'EPSG:4131', // Indian 1960
  'EPSG:4132', // FD58
  'EPSG:4133', // EST92
  'EPSG:4134', // PSD93
  'EPSG:4135', // Old Hawaiian
  'EPSG:4136', // St. Lawrence Island
  'EPSG:4137', // St. Paul Island
  'EPSG:4138', // St. George Island
  'EPSG:4139', // Puerto Rico
  'EPSG:4140', // NAD83(CSRS98)
  'EPSG:4141', // Israel 1993
  'EPSG:4142', // Locodjo 1965
  'EPSG:4143', // Abidjan 1987
  'EPSG:4144', // Kalianpur 1937
  'EPSG:4145', // Kalianpur 1962
  'EPSG:4146', // Kalianpur 1975
  'EPSG:4147', // Hanoi 1972
  'EPSG:4148', // Hartebeesthoek94
  'EPSG:4149', // CH1903
  'EPSG:4150', // CH1903+
  'EPSG:4151', // CHTRS95
  'EPSG:4152', // NAD83(HARN)
  'EPSG:4153', // Rassadiran
  'EPSG:4154', // ED50(ED77)
  'EPSG:4155', // Dabola 1981
  'EPSG:4156', // S-JTSK
  'EPSG:4157', // Mount Dillon
  'EPSG:4158', // Naparima 1955
  'EPSG:4159', // ELD79
  'EPSG:4160', // Chos Malal 1914
  'EPSG:4161', // Pampa del Castillo
  'EPSG:4162', // Korean 1985
  'EPSG:4163', // Yemen NGN96
  'EPSG:4164', // South Yemen
  'EPSG:4165', // Bissau
  'EPSG:4166', // Korean 1995
  'EPSG:4167', // NZGD2000
  'EPSG:4168', // Accra
  'EPSG:4169', // American Samoa 1962
  'EPSG:4170', // SIRGAS 1995
  'EPSG:4171', // RGF93 v1
  'EPSG:4172', // POSGAR
  'EPSG:4173', // IRENET95
  'EPSG:4174', // Sierra Leone 1924
  'EPSG:4175', // Sierra Leone 1968
  'EPSG:4176', // Australian Antarctic
  'EPSG:4178', // Pulkovo 1942(83)
  'EPSG:4179', // Pulkovo 1942(58)
  'EPSG:4180', // EST97
  'EPSG:4181', // LUREF
  'EPSG:4182', // Azores Occidental 1939
  'EPSG:4183', // Azores Central 1948
  'EPSG:4184', // Azores Oriental 1940
  'EPSG:4185', // Madeira 1936
  'EPSG:4188', // OSNI 1952
  'EPSG:4189', // REGVEN
  'EPSG:4190', // POSGAR 98
  'EPSG:4191', // Albanian 1987
  'EPSG:4192', // Douala 1948
  'EPSG:4193', // Manoca 1962
  'EPSG:4194', // Qornoq 1927
  'EPSG:4195', // Scoresbysund 1952
  'EPSG:4196', // Ammassalik 1958
  'EPSG:4197', // Garoua
  'EPSG:4198', // Kousseri
  'EPSG:4199', // Egypt 1930
  'EPSG:4200', // Pulkovo 1995
  'EPSG:4201', // Adindan
  'EPSG:4202', // AGD66
  'EPSG:4203', // AGD84
  'EPSG:4204', // Ain el Abd
  'EPSG:4205', // Afgooye
  'EPSG:4206', // Agadez
  'EPSG:4207', // Lisbon
  'EPSG:4208', // Aratu
  'EPSG:4209', // Arc 1950
  'EPSG:4210', // Arc 1960
  'EPSG:4211', // Batavia
  'EPSG:4212', // Barbados 1938
  'EPSG:4213', // Beduaram
  'EPSG:4214', // Beijing 1954
  'EPSG:4215', // BD50
  'EPSG:4216', // Bermuda 1957
  'EPSG:4218', // Bogota 1975
  'EPSG:4219', // Bukit Rimpah
  'EPSG:4220', // Camacupa 1948
  'EPSG:4221', // Campo Inchauspe
  'EPSG:4222', // Cape
  'EPSG:4223', // Carthage
  'EPSG:4224', // Chua
  'EPSG:4225', // Corrego Alegre 1970-72
  'EPSG:4226', // Cote d'Ivoire
  'EPSG:4227', // Deir ez Zor
  'EPSG:4228', // Douala
  'EPSG:4229', // Egypt 1907
  'EPSG:4230', // ED50
  'EPSG:4231', // ED87
  'EPSG:4232', // Fahud
  'EPSG:4233', // Gandajika 1970
  'EPSG:4234', // Garoua
  'EPSG:4235', // Guyane Francaise
  'EPSG:4236', // Hu Tzu Shan 1950
  'EPSG:4237', // HD72
  'EPSG:4238', // ID74
  'EPSG:4239', // Indian 1954
  'EPSG:4240', // Indian 1975
  'EPSG:4241', // Jamaica 1875
  'EPSG:4242', // JAD69
  'EPSG:4243', // Kalianpur 1880
  'EPSG:4244', // Kandawala
  'EPSG:4245', // Kertau 1968
  'EPSG:4246', // KOC
  'EPSG:4247', // La Canoa
  'EPSG:4248', // PSAD56
  'EPSG:4249', // Lake
  'EPSG:4250', // Leigon
  'EPSG:4251', // Liberia 1964
  'EPSG:4252', // Lome
  'EPSG:4253', // Luzon 1911
  'EPSG:4254', // Hito XVIII 1963
  'EPSG:4255', // Herat North
  'EPSG:4256', // Mahe 1971
  'EPSG:4257', // Makassar
  'EPSG:4258', // ETRS89
  'EPSG:4259', // Malongo 1987
  'EPSG:4260', // Manoca
  'EPSG:4261', // Merchich
  'EPSG:4262', // Massawa
  'EPSG:4263', // Minna
  'EPSG:4264', // Mhast
  'EPSG:4265', // Monte Mario
  'EPSG:4266', // M'poraloko
  'EPSG:4267', // NAD27
  'EPSG:4268', // NAD27 Michigan
  'EPSG:4269', // NAD83
  'EPSG:4270', // Nahrwan 1967
  'EPSG:4271', // Naparima 1972
  'EPSG:4272', // NZGD49
  'EPSG:4273', // NGO 1948
  'EPSG:4274', // Datum 73
  'EPSG:4275', // NTF
  'EPSG:4276', // NSWC 9Z-2
  'EPSG:4277', // OSGB36
  'EPSG:4278', // OSGB70
  'EPSG:4279', // OS(SN)80
  'EPSG:4280', // Padang
  'EPSG:4281', // Palestine 1923
  'EPSG:4282', // Pointe Noire
  'EPSG:4283', // GDA94
  'EPSG:4284', // Pulkovo 1942
  'EPSG:4285', // Qatar 1974
  'EPSG:4286', // Qatar 1948
  'EPSG:4287', // Qornoq
  'EPSG:4288', // Loma Quintana
  'EPSG:4289', // Amersfoort
  'EPSG:4291', // SAD69
  'EPSG:4292', // Sapper Hill 1943
  'EPSG:4293', // Schwarzeck
  'EPSG:4294', // Segora
  'EPSG:4295', // Serindung
  'EPSG:4296', // Sudan
  'EPSG:4297', // Tananarive
  'EPSG:4298', // Timbalai 1948
  'EPSG:4299', // TM65
  'EPSG:4300', // TM75
  'EPSG:4301', // Tokyo
  'EPSG:4302', // Trinidad 1903
  'EPSG:4303', // TC(1948)
  'EPSG:4304', // Voirol 1875
  'EPSG:4306', // Bern 1938
  'EPSG:4307', // Nord Sahara 1959
  'EPSG:4308', // RT38
  'EPSG:4309', // Yacare
  'EPSG:4310', // Yoff
  'EPSG:4311', // Zanderij
  'EPSG:4312', // MGI
  'EPSG:4313', // BD72
  'EPSG:4314', // DHDN
  'EPSG:4315', // Conakry 1905
  'EPSG:4316', // Dealul Piscului 1930
  'EPSG:4317', // Dealul Piscului 1970
  'EPSG:4318', // NGN
  'EPSG:4319', // KUDAMS
  'EPSG:4322', // WGS 72
  'EPSG:4324', // WGS 72BE
  'EPSG:4326', // WGS 84
  'EPSG:4463', // RGSPM06
  'EPSG:4470', // RGM04
  'EPSG:4475', // Cadastre 1997
  'EPSG:4483', // Mexico ITRF92
  'EPSG:4490', // China Geodetic Coordinate System 2000
  'EPSG:4555', // New Beijing
  'EPSG:4558', // RRAF 1991
  'EPSG:4600', // Anguilla 1957
  'EPSG:4601', // Antigua 1943
  'EPSG:4602', // Dominica 1945
  'EPSG:4603', // Grenada 1953
  'EPSG:4604', // Montserrat 1958
  'EPSG:4605', // St. Kitts 1955
  'EPSG:4606', // St. Lucia 1955
  'EPSG:4607', // St. Vincent 1945
  'EPSG:4608', // NAD27(76)
  'EPSG:4609', // NAD27(CGQ77)
  'EPSG:4610', // Xian 1980
  'EPSG:4611', // Hong Kong 1980
  'EPSG:4612', // JGD2000
  'EPSG:4613', // Segara
  'EPSG:4614', // QND95
  'EPSG:4615', // Porto Santo
  'EPSG:4616', // Selvagem Grande
  'EPSG:4617', // NAD83(CSRS)
  'EPSG:4618', // SAD69
  'EPSG:4619', // SWEREF99
  'EPSG:4620', // Point 58
  'EPSG:4621', // Fort Marigot
  'EPSG:4622', // Guadeloupe 1948
  'EPSG:4623', // CSG67
  'EPSG:4624', // RGFG95
  'EPSG:4625', // Martinique 1938
  'EPSG:4626', // Reunion 1947
  'EPSG:4627', // RGR92
  'EPSG:4628', // Tahiti 52
  'EPSG:4629', // Tahaa 54
  'EPSG:4630', // IGN72 Nuku Hiva
  'EPSG:4631', // K0 1949
  'EPSG:4632', // Combani 1950
  'EPSG:4633', // IGN56 Lifou
  'EPSG:4634', // IGN72 Grand Terre
  'EPSG:4635', // ST87 Ouvea
  'EPSG:4636', // Petrels 1972
  'EPSG:4637', // Perroud 1950
  'EPSG:4638', // Saint Pierre et Miquelon 1950
  'EPSG:4639', // MOP78
  'EPSG:4640', // RRAF 1991
  'EPSG:4641', // IGN53 Mare
  'EPSG:4642', // ST84 Ile des Pins
  'EPSG:4643', // ST71 Belep
  'EPSG:4644', // NEA74 Noumea
  'EPSG:4645', // RGNC 1991
  'EPSG:4646', // Grand Comoros
  'EPSG:4657', // Reykjavik 1900
  'EPSG:4658', // Hjorsey 1955
  'EPSG:4659', // ISN93
  'EPSG:4660', // Helle 1954
  'EPSG:4661', // LKS-92
  'EPSG:4662', // IGN72 Grande Terre
  'EPSG:4663', // Porto Santo 1995
  'EPSG:4664', // Azores Oriental 1995
  'EPSG:4665', // Azores Central 1995
  'EPSG:4666', // Lisbon 1890
  'EPSG:4667', // IKBD-92
  'EPSG:4668', // ED79
  'EPSG:4669', // LKS94
  'EPSG:4670', // IGM95
  'EPSG:4671', // Voirol 1879
  'EPSG:4672', // Chatham Islands 1971
  'EPSG:4673', // Chatham Islands 1979
  'EPSG:4674', // SIRGAS 2000
  'EPSG:4675', // Guam 1963
  'EPSG:4676', // Vientiane 1982
  'EPSG:4677', // Lao 1993
  'EPSG:4678', // Lao 1997
  'EPSG:4679', // Jouik 1961
  'EPSG:4680', // Nouakchott 1965
  'EPSG:4681', // Mauritania 1999
  'EPSG:4682', // Gulshan 303
  'EPSG:4683', // PRS92
  'EPSG:4684', // Gan 1970
  'EPSG:4685', // Gandajika
  'EPSG:4686', // MAGNA-SIRGAS
  'EPSG:4687', // RGPF
  'EPSG:4688', // Fatu Iva 72
  'EPSG:4689', // IGN63 Hiva Oa
  'EPSG:4690', // Tahiti 79
  'EPSG:4691', // Moorea 87
  'EPSG:4692', // Maupiti 83
  'EPSG:4693', // Nakhl-e Ghanem
  'EPSG:4694', // POSGAR 94
  'EPSG:4695', // Katanga 1955
  'EPSG:4696', // Kasai 1953
  'EPSG:4697', // IGC 1962 6th Parallel South
  'EPSG:4698', // IGN 1962 Kerguelen
  'EPSG:4699', // Le Pouce 1934
  'EPSG:4700', // IGN Astro 1960
  'EPSG:4701', // IGCB 1955
  'EPSG:4702', // Mauritania 1999
  'EPSG:4703', // Mhast 1951
  'EPSG:4704', // Mhast (onshore)
  'EPSG:4705', // Mhast (offshore)
  'EPSG:4706', // Egypt Gulf of Suez S-650 TL
  'EPSG:4707', // Tern Island 1961
  'EPSG:4708', // Cocos Islands 1965
  'EPSG:4709', // Iwo Jima 1945
  'EPSG:4710', // Astro DOS 71
  'EPSG:4711', // Marcus Island 1952
  'EPSG:4712', // Ascension Island 1958
  'EPSG:4713', // Ayabelle Lighthouse
  'EPSG:4714', // Bellevue
  'EPSG:4715', // Camp Area Astro
  'EPSG:4716', // Phoenix Islands 1966
  'EPSG:4717', // Cape Canaveral
  'EPSG:4718', // Solomon 1968
  'EPSG:4719', // Easter Island 1967
  'EPSG:4720', // Fiji 1986
  'EPSG:4721', // Fiji 1956
  'EPSG:4722', // South Georgia 1968
  'EPSG:4723', // GCGD59
  'EPSG:4724', // Diego Garcia 1969
  'EPSG:4725', // Johnston Island 1961
  'EPSG:4726', // SIGD61
  'EPSG:4727', // Midway 1961
  'EPSG:4728', // PN84
  'EPSG:4729', // Pitcairn 1967
  'EPSG:4730', // Santo 1965
  'EPSG:4731', // Viti Levu 1916
  'EPSG:4732', // Marshall Islands 1960
  'EPSG:4733', // Wake Island 1952
  'EPSG:4734', // Tristan 1968
  'EPSG:4735', // Kusaie 1951
  'EPSG:4736', // Deception Island
  'EPSG:4737', // KGD2002
  'EPSG:4738', // Hong Kong 1963
  'EPSG:4739', // Hong Kong 1963(67)
  'EPSG:4740', // PZ-90
  'EPSG:4741', // FD54
  'EPSG:4742', // GDM2000
  'EPSG:4743', // Karbala 1979
  'EPSG:4744', // Nahrwan 1934
  'EPSG:4745', // RD/83
  'EPSG:4746', // PD/83
  'EPSG:4747', // GR96
  'EPSG:4748', // Vanua Levu 1915
  'EPSG:4749', // RGNC91-93
  'EPSG:4750', // ST87 Ouvea
  'EPSG:4751', // Kertau (RSO)
  'EPSG:4752', // Viti Levu 1912
  'EPSG:4753', // fk89
  'EPSG:4754', // LGD2006
  'EPSG:4755', // DGN95
  'EPSG:4756', // VN-2000
  'EPSG:4757', // SVY21
  'EPSG:4758', // JAD2001
  'EPSG:4759', // NAD83(NSRS2007)
  'EPSG:4760', // WGS 66
  'EPSG:4761', // HTRS96
  'EPSG:4762', // BDA2000
  'EPSG:4763', // Pitcairn 2006
  'EPSG:4764', // RSRGD2000
  'EPSG:4765', // Slovenia 1996
  'EPSG:4801', // CH1903 (Bern)
  'EPSG:4802', // Bogota 1975 (Bogota)
  'EPSG:4803', // Lisbon (Lisbon)
  'EPSG:4804', // Makassar (Jakarta)
  'EPSG:4805', // MGI (Ferro)
  'EPSG:4806', // Monte Mario (Rome)
  'EPSG:4807', // NTF (Paris)
  'EPSG:4808', // Padang (Jakarta)
  'EPSG:4809', // BD50 (Brussels)
  'EPSG:4810', // Tananarive (Paris)
  'EPSG:4811', // Voirol 1875 (Paris)
  'EPSG:4813', // Batavia (Jakarta)
  'EPSG:4814', // RT38 (Stockholm)
  'EPSG:4815', // Greek (Athens)
  'EPSG:4816', // Carthage (Paris)
  'EPSG:4817', // NGO 1948 (Oslo)
  'EPSG:4818', // S-JTSK (Ferro)
  'EPSG:4819', // Nord Sahara 1959 (Paris)
  'EPSG:4820', // Segara (Jakarta)
  'EPSG:4821', // Voirol 1879 (Paris)
  'EPSG:4823', // Sao Tome
  'EPSG:4824', // Principe
  'EPSG:4901', // ATF (Paris)
  'EPSG:4902', // NDG (Paris)
  'EPSG:4903', // Madrid 1870 (Madrid)
  'EPSG:4904', // Lisbon 1890 (Lisbon)
  'EPSG:5013', // PTRA08
  'EPSG:5132', // Tokyo 1892
  'EPSG:5228', // S-JTSK/05
  'EPSG:5229', // S-JTSK/05 (Ferro)
  'EPSG:5233', // SLD99
  'EPSG:5246', // GDBD2009
  'EPSG:5252', // TUREF
  'EPSG:5264', // DRUKREF 03
  'EPSG:5324', // ISN2004
  'EPSG:5340', // POSGAR 2007
  'EPSG:5354', // MARGEN
  'EPSG:5360', // SIRGAS-Chile 2002
  'EPSG:5365', // CR05
  'EPSG:5371', // MACARIO SOLIS
  'EPSG:5373', // Peru96
  'EPSG:5381', // SIRGAS-ROU98
  'EPSG:5393', // SIRGAS_ES2007.8
  'EPSG:5451', // Ocotepeque 1935
  'EPSG:5464', // Sibun Gorge 1922
  'EPSG:5467', // Panama-Colon 1911
  'EPSG:5489', // RGAF09
  'EPSG:5524', // Corrego Alegre 1961
  'EPSG:5527', // SAD69(96)
  'EPSG:5546', // PNG94
  'EPSG:5561', // UCS-2000
  'EPSG:5593', // FEH2010
  'EPSG:5681', // DB_REF
  'EPSG:5886', // TGD2005
  'EPSG:6135', // CIGD11
  'EPSG:6207', // Nepal 1981
  'EPSG:6311', // CGRS93
  'EPSG:6318', // NAD83(2011)
  'EPSG:6322', // NAD83(PA11)
  'EPSG:6325', // NAD83(MA11)
  'EPSG:6365', // Mexico ITRF2008
  'EPSG:6668', // JGD2011
  'EPSG:6706', // RDN2008
  'EPSG:6783', // NAD83(CORS96)
  'EPSG:6881', // Aden 1925
  'EPSG:6882', // Bekaa Valley 1920
  'EPSG:6883', // Bioko
  'EPSG:6892', // South East Island 1943
  'EPSG:6894', // Gambia
  'EPSG:6980', // IGD05
  'EPSG:6983', // IG05 Intermediate CRS
  'EPSG:6987', // IGD05/12
  'EPSG:6990', // IG05/12 Intermediate CRS
  'EPSG:7073', // RGTAAF07
  'EPSG:7136', // IGD05
  'EPSG:7139', // IGD05/12
  'EPSG:7373', // ONGD14
  'EPSG:7683', // GSK-2011
  'EPSG:7686', // Kyrg-06
  'EPSG:7798', // BGS2005
  'EPSG:7844', // GDA2020
  'EPSG:7881', // St. Helena Tritan
  'EPSG:7886', // SHGD2015
  'EPSG:8042', // Gusterberg (Ferro)
  'EPSG:8043', // St. Stephen (Ferro)
  'EPSG:8086', // ISN2016
  'EPSG:8232', // NAD83(CSRS96)
  'EPSG:8237', // NAD83(CSRS)v2
  'EPSG:8240', // NAD83(CSRS)v3
  'EPSG:8246', // NAD83(CSRS)v4
  'EPSG:8249', // NAD83(CSRS)v5
  'EPSG:8252', // NAD83(CSRS)v6
  'EPSG:8255', // NAD83(CSRS)v7
  'EPSG:8351', // S-JTSK [JTSK03]
  'EPSG:8427', // Hong Kong Geodetic CS
  'EPSG:8428', // Macao 1920
  'EPSG:8431', // Macao 2008
  'EPSG:8449', // NAD83(FBN)
  'EPSG:8545', // NAD83(HARN Corrected)
  'EPSG:8685', // SRB_ETRS89
  'EPSG:8694', // Camacupa 2015
  'EPSG:8699', // RSAO13
  'EPSG:8818', // MTRF-2000
  'EPSG:8860', // NAD83(FBN)
  'EPSG:8888', // WGS 84 (Transit)
  'EPSG:8900', // RGWF96
  'EPSG:8907', // CR-SIRGAS
  'EPSG:8949', // SIRGAS-Chile 2010
  'EPSG:8972', // SIRGAS-CON DGF00P01
  'EPSG:8973', // SIRGAS-CON DGF01P01
  'EPSG:8974', // SIRGAS-CON DGF01P02
  'EPSG:8975', // SIRGAS-CON DGF02P01
  'EPSG:8976', // SIRGAS-CON DGF04P01
  'EPSG:8977', // SIRGAS-CON DGF05P01
  'EPSG:8978', // SIRGAS-CON DGF06P01
  'EPSG:8979', // SIRGAS-CON DGF07P01
  'EPSG:8980', // SIRGAS-CON DGF08P01
  'EPSG:8981', // SIRGAS-CON SIR09P01
  'EPSG:8982', // SIRGAS-CON SIR10P01
  'EPSG:8983', // SIRGAS-CON SIR11P01
  'EPSG:8984', // SIRGAS-CON SIR13P01
  'EPSG:8985', // SIRGAS-CON SIR14P01
  'EPSG:8986', // SIRGAS-CON SIR15P01
  'EPSG:8987', // SIRGAS-CON SIR17P01
  'EPSG:8988', // ITRF88
  'EPSG:8989', // ITRF89
  'EPSG:8990', // ITRF90
  'EPSG:8991', // ITRF91
  'EPSG:8992', // ITRF92
  'EPSG:8993', // ITRF93
  'EPSG:8994', // ITRF94
  'EPSG:8995', // ITRF96
  'EPSG:8996', // ITRF97
  'EPSG:8997', // ITRF2000
  'EPSG:8998', // ITRF2005
  'EPSG:8999', // ITRF2008
  'EPSG:9000', // ITRF2014
  'EPSG:9003', // IGS97
  'EPSG:9006', // IGS00
  'EPSG:9009', // IGb00
  'EPSG:9012', // IGS05
  'EPSG:9014', // IGS08
  'EPSG:9017', // IGb08
  'EPSG:9019', // IGS14
  'EPSG:9053', // WGS 84 (G730)
  'EPSG:9054', // WGS 84 (G873)
  'EPSG:9055', // WGS 84 (G1150)
  'EPSG:9056', // WGS 84 (G1674)
  'EPSG:9057', // WGS 84 (G1762)
  'EPSG:9059', // ETRF89
  'EPSG:9060', // ETRF90
  'EPSG:9061', // ETRF91
  'EPSG:9062', // ETRF92
  'EPSG:9063', // ETRF93
  'EPSG:9064', // ETRF94
  'EPSG:9065', // ETRF96
  'EPSG:9066', // ETRF97
  'EPSG:9067', // ETRF2000
  'EPSG:9068', // ETRF2005
  'EPSG:9069', // ETRF2014
  'EPSG:9072', // NAD83(MARP00)
  'EPSG:9075', // NAD83(PACP00)
  'EPSG:9140', // KOSOVAREF01
  'EPSG:9148', // SIRGAS-Chile 2013
  'EPSG:9153', // SIRGAS-Chile 2016
  'EPSG:9184', // SIRGAS-Chile
  'EPSG:9248', // Tapi Aike
  'EPSG:9251', // MMN
  'EPSG:9253', // MMS
  'EPSG:9294', // ONGD17
  'EPSG:9299', // HS2-IRF
  'EPSG:9309', // ATRF2014
  'EPSG:9333', // KSA-GRF17
  'EPSG:9364', // TPEN11-IRF
  'EPSG:9372', // MML07-IRF
  'EPSG:9380', // IGb14
  'EPSG:9384', // AbInvA96_2020-IRF
  'EPSG:9403', // PN68
  'EPSG:9453', // GBK19-IRF
  'EPSG:9470', // SRGI2013
  'EPSG:9474', // PZ-90.02
  'EPSG:9475', // PZ-90.11
  'EPSG:9547', // LTF2004(G)
  'EPSG:9696', // REDGEOMIN
  'EPSG:9702', // ETRF2000-PL
  'EPSG:9739', // EOS21-IRF
  'EPSG:9755', // WGS 84 (G2139)
  'EPSG:9758', // ECML14_NB-IRF
  'EPSG:9763', // EWR2-IRF
  'EPSG:9777', // RGF93 v2
  'EPSG:9782', // RGF93 v2b
  'EPSG:9866', // MRH21-IRF
  'EPSG:9871', // MOLDOR11-IRF
  'EPSG:9939', // EBBWV14-IRF
  'EPSG:9964', // HULLEE13-IRF
  'EPSG:9969', // SCM22-IRF
  'EPSG:9974', // FNL22-IRF
  'EPSG:9990', // ITRF2020
  'EPSG:10158', // S34J-IRF
  'EPSG:10175', // DoPw22-IRF
  'EPSG:10178', // IGS20
  'EPSG:10185', // ShAb07-IRF
  'EPSG:10191', // CNH22-IRF
  'EPSG:10196', // CWS13-IRF
  'EPSG:10204', // DIBA15-IRF
  'EPSG:10209', // GWPBS22-IRF
  'EPSG:10214', // GWWAB22-IRF
  'EPSG:10219', // GWWWA22-IRF
  'EPSG:10224', // MALS09-IRF
  'EPSG:10229', // OxWo08-IRF
  'EPSG:10237', // SYC20-IRF
  'EPSG:10249', // S34S-IRF
  'EPSG:10252', // S45B-IRF
  'EPSG:10256', // GS-IRF
  'EPSG:10260', // GSB-IRF
  'EPSG:10265', // KK-IRF
  'EPSG:10268', // Ostenfeld-IRF
  'EPSG:10272', // SMITB20-IRF
  'EPSG:10277', // RBEPP12-IRF
  'EPSG:10284', // ETRS89/DREF91/2016
  'EPSG:10299', // RGSH2020
  'EPSG:10305', // LKS-2020
  'EPSG:10310', // RGNC15
  'EPSG:10328', // BH_ETRS89
  'EPSG:10345', // Hughes 1980
  'EPSG:10346', // NSIDC Authalic Sphere
  'EPSG:10414', // NAD83(CSRS)v8
  'EPSG:10468', // COV23-IRF
  'EPSG:10475', // BBT2000
  'EPSG:10571', // ETRF2020
  'EPSG:10606', // WGS 84 (G2296)
  'EPSG:10623', // ECML14-IRF
  'EPSG:10628', // WC05-IRF
  'EPSG:10671', // RGM23
  'EPSG:20033', // MWC18-IRF
  'EPSG:20041', // SIRGAS-Chile 2021
  'EPSG:20046', // MAGNA-SIRGAS 2018
];

/**
 * Inverted coordinates is meant from the POV of a programmer, i.e. Y before X
 * Note: can handle full URNs for EPSG codes
 */
export function hasInvertedCoordinates(crsName: CrsCode) {
  return LatLonCrsList.indexOf(simplifyEpsgUrn(crsName)) > -1;
}

/**
 * When given a full URN pointing to an EPSG code, will return the simplified
 * name, e.g.: `urn:ogc:def:crs:EPSG::2154` translates to `EPSG:2154`
 * On other kind of URNs (i.e. `urn:ogc:def:crs:OGC:1.3:CRS84`), returns the
 * URN untouched
 */
export function simplifyEpsgUrn(fullCrsName: CrsCode): CrsCode {
  if (/^urn:(?:x-)?ogc:def:crs:epsg:/.test(fullCrsName.toLowerCase())) {
    const code = /([0-9]+)$/.exec(fullCrsName)[1];
    return `EPSG:${code}`;
  }
  return fullCrsName;
}
