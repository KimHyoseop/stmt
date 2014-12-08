var mysql = require('mysql');
var gcm = require('node-gcm');
require('date-utils');

var pool = mysql.createPool({
	host:'54.64.199.198',
	port:3306,
	user:'root',
	password:'0629',
	database:'kimyo'
});


exports.test = function(req, res){
	pool.getConnection(function(err, connection){
		if(err){
			console.error('Connection error : ',err);
			res.statusCode = 503;
			res.send({
				resul:'error',
				err : err.code
			});
		}else{
			 connection.query('SELECT * FROM member', function(err, rows){
				connection.release();
				res.charset = "utf-8";
				res.json(rows);
			});
		 }
	});
};

exports.join = function(req, res){
	pool.getConnection(function(err,connection){
		connection.query('SELECT U_Id FROM member WHERE U_Id=?',[req.query.id],function(err, rows){
			connection.release();
			if(rows.length==1){
				res.send(200,'false');
			}else{
				connection.query('INSERT INTO member (U_Id,name,pwd) values (?,?,?)',
				[req.query.id,req.query.name,req.query.pwd],function(err, rows){
					connection.release();
					res.send(200,'true');
				});
			}
		});
	});
};

exports.login = function(req, res){
	pool.getConnection(function(err,connection){
		connection.query('SELECT U_Id FROM member where U_id=? and pwd=?',[req.query.id,req.query.pwd],function(err,rows){
			connection.release();
			if(rows.length==0){
				res.send(200,'false');
			}else{
				res.send(200,'true');
			}
		});
	});
};

exports.reg_plant = function(req, res){
	pool.getConnection(function(err,connection){
		connection.query('INSERT INTO plant_user(U_Id,P_Id) VALUES (?,?)',[req.query.id,req.query.p_id],function(err,rows){
			connection.release();
			if(rows==undefined){
				res.send(200,'false');
			}else{
				res.send(200,'true');
			}
		});
	});
};

exports.record_info = function(req, res){
	pool.getConnection(function(err, connection){
		var dt = new Date();
		var d = dt.toFormat('YYYY-MM-DD HH24:MI:SS');
		connection.query('SELECT count(*) cnt from plant_info where P_Id=?',[req.query.p_id],function(err, rows){
			var temp = rows[0].cnt;
			if(temp > 360){
				connection.query('delete from plant_info WHERE info_Id = (select info_Id from ( select * from plant_info WHERE P_Id = ? order by info_Id asc) a Limit 0,1); ',[req.query.p_id],function(err,rows){
					connection.release();
					console.log('delete a row');
				});
			}
		});
		if(req.query.humid < 20){
			connection.query('UPDATE plant_user SET isWatering = 1 WHERE p_id=?',[req.query.p_id],function(err, rows){
				console.log('not enough Water');
				connection.release();
			});
		}
		connection.query('INSERT INTO plant_info(P_Id,time,temperature,humidity,illumination) VALUES (?,?,?,?,?)',[req.query.p_id, d, req.query.temp, req.query.humid, req.query.ill], function(err,rows){
			connection.release();
			if(rows==undefined){
				res.send(200,'false');
			}else{
				res.send(200,'true');
			}
		});
	});
};

exports.load_info = function(req, res){
	pool.getConnection(function(err, connection){
		connection.query('select * from (select * from plant_info where P_Id=? order by info_id desc LIMIT 0,6) a order by info_id asc',[req.query.p_id],function(err, rows){
			connection.release();
			if(rows.length == 0){
				res.send(200,'false');
			}else{
				res.charset = "utf-8";
				res.json(rows);
			}
		});
	});
};

exports.myplant = function(req,res){
	pool.getConnection(function(err, connection){
		connection.query('SELECT p_id FROM plant_user WHERE U_Id = ?',[req.query.id],function(err, rows){
			connection.release();
			if(rows.length == 0){
				res.send(200,'false');
			}else{
				res.charset = "utf-8";
				res.json(rows);
			}
		});
	});
};

exports.setwater = function(req,res){
	pool.getConnection(function(err, connection){
		connection.query('UPDATE plant_user SET iswatering = 1 WHERE p_id = ?',[req.query.p_id],function(err, rows){
			connection.release();
			if(rows == undefined){
				res.send(200,'false');
			}else{
				res.send(200,'true');
			}
		});
	});
};

exports.iswater = function(req,res){
	pool.getConnection(function(err,connection){
		connection.query('SELECT isWatering FROM plant_user WHERE p_id = ?',[req.query.p_id],function(err,rows){
			connection.release();
			if(rows[0].isWatering == 1){
				console.log('not enough water');
				res.send(200,'1');
				connection.query('UPDATE plant_user SET isWatering = 0 WHERE p_id = ?',[req.query.p_id],function(err,rows){
					connection.release();
					var dt = new Date();
					var d = dt.toFormat('YYYY-MM-DD HH24:MI:SS');
					connection.query('INSERT INTO water_Supply (P_Id, date) VALUES (?,?)',[req.query.p_id,d],function(err,rows){
						connection.release();
					});
				});
			}else{
				console.log('enough water');
				res.send(200,'0');
			}
		});
	});
};

exports.setspin = function(req,res){
    pool.getConnection(function(err, connection){
        connection.query('UPDATE plant_user SET spin = 1 WHERE p_id = ?',[req.query.p_id],function(err, rows){
           connection.release();
            if(rows == undefined){
               res.send(200,'false');
            }else{
               res.send(200,'true');
            }
        });
    });
};

exports.isspin = function(req,res){
    pool.getConnection(function(err,connection){
        connection.query('SELECT spin FROM plant_user WHERE p_id = ?',[req.query.p_id],function(err,rows){
            connection.release();
            if(rows[0].spin == 1){
                console.log('not spin');
                res.send(200,'1');
				connection.query('UPDATE plant_user SET spin = 0 where p_id =?',[req.query.p_id],function(err, rows){
					connection.release();
					});
			}else{
                console.log('spinning');
                res.send(200,'0');
            }
        });
    });
};

exports.setLEDon = function(req,res){
	pool.getConnection(function(err, connection){
		connection.query('UPDATE plant_user SET LED = 1 WHERE p_id = 2',[req.query.p_id],function(err, rows){
			connection.release();
            if(rows == undefined){
               res.send(200,'false');
            }else{
               res.send(200,'true');
            }
        });
    });
};

exports.setLEDoff = function(req,res){
	pool.getConnection(function(err, connection){
		connection.query('UPDATE plant_user SET LED = 0 WHERE p_id = 2',[req.query.p_id],function(err, rows){
			connection.release();
            if(rows == undefined){
               res.send(200,'false');
            }else{
               res.send(200,'true');
            }
        });
    });
};

exports.isLED = function(req,res){
    pool.getConnection(function(err,connection){
        connection.query('SELECT LED FROM plant_user WHERE p_id  =?',[req.query.p_id],function(err,rows){
	        connection.release();
            if(rows[0].LED == 1){
				console.log('LED OFF');
                res.send(200,'1');
				connection.query('UPDATE plant_user SET LED = 1 WHERE p_id = ?'[req.query.p_id],function(err,row){
					connection.release();
				});
            }else{
                console.log('LED ON');
                res.send(200,'0');
				connection.query('UPDATE plant_user SET LED = 0 WHERE p_id = ?'[req.query.p_id],function(err,row){
					connection.release();
				});
			}
        });
    });
};

exports.setcamera = function(req,res){
    pool.getConnection(function(err,connection){
        connection.query('UPDATE plant_user SET iscamera=1 WHERE p_id = ?',[req.query.p_id],function(err,rows){
            connection.release();
            if(rows == undefined){
                res.send(200,'false');
            }else{
                res.send(200,'ture');
			}
        });
    });
};

exports.iscamera = function(req,res){
    pool.getConnection(function(err,connection){
        connection.query('SELECT iscamera FROM plant_user WHERE p_id = ?',[req.query.p_id],function(err,rows){
            connection.release();
            if(rows[0].isWatering == 1){
                console.log('not taking');
                res.send(200,'1');
                connection.query('UPDATE plant_user SET iscamera = 0 WHERE p_id = ?',[req.query.p_id],function(err,rows){
                   connection.release();
                    var dt = new Date();
                    var d = dt.toFormat('YYYY-MM-DD HH24:MI:SS');
                    connection.query('INSERT INTO camera (P_Id, date) VALUES (?,?)',[req.query.p_id,d],function(err,rows){
                    connection.release();
                   });
                });
            }else{
                console.log('taking');
                res.send(200,'0');
            }
        });
    });
};

exports.loadpicture = function(req,res){
    pool.getConnection(function(err, connection){
        connection.query('SELECT * FROM (SELECT * FROM camera WHERE p_id = ? ORDER BY C_Id DESC LIMIT 0,50) a ORDER BY c_id ASC',[req.query.p_id],function(err,rows){
            connection.release();
            if(rows.length == 0){
                res.send(200,'false');
            }else{
                res.charset = "utf-8";
                res.json(rows);
            }
        });
    });
};

exports.loadwater=function(req,res){
	pool.getConnection(function(err, connection){
		connection.query('SELECT * FROM (SELECT * FROM water_Supply WHERE p_id = ? ORDER BY W_Id DESC LIMIT 0,10) a ORDER BY w_id ASC',[req.query.p_id],function(err,rows){
			connection.release();
			if(rows.length == 0){
				res.send(200,'false');
			}else{
				res.charset = "utf-8";
				res.json(rows);
			}
		});
	});
};
