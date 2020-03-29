create role globalsns_admin with login password 'password';
GRANT globalsns_admin TO postgres;

CREATE ROLE codimd WITH LOGIN PASSWORD 'password';
create database hackmd owner codimd;
GRANT CREATE,TEMPORARY,TEMP ON DATABASE hackmd TO codimd ;
