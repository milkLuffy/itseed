/**
 * UserController
 *
 * @描述 : 使用者相關
 * @文件 : Se http://links.sailsjs.org/docs/controllers
 */

require('dotenv').config()
var md5 = require("MD5")
var fs = require("fs");

function registerAccount(res,newuser,callback){
	// 		 一般會員  email + pwd 		註冊
	// goolge登入會員  email + gIdToken 註冊

    //驗證是否重複註冊（信箱是否被使用過）
    //  一般會員     註冊 => 已經被 google登入註冊過 => 補上 password
    //  google登入  註冊 => 已經被 一般註冊註冊過    => 補上 gIdToken
    var value = {};
    User.findOne({ email: newuser.email }).exec(function (err, user) {
        if (err) { return res.end(JSON.stringify(err)); }
        if(user != undefined){
            // 補上 gIdToken
            if (!user.gIdToken && newuser.gIdToken){
                value.gIdToken = newuser.gIdToken;
                User.update({
                    id: user.id
                },value).exec(function (err,data) {
                    if (err) { res.end(JSON.stringify(err)); }
                    User.findOne({id: user.id}).exec(function (err, updated_user) {
                        if (err) { res.end(JSON.stringify(err)); }
                        callback(updated_user);
                    });
                });
            }else  if (!user.pwd  && newuser.pwd ){
                // 補上 pwd
                value.pwd = newuser.pwd;
                User.update({id: user.id}, {value}).exec(function (err, user) {
                    if (err) { res.end(JSON.stringify(err)); }
                    User.findOne({ id: user.id }).exec(function (err, updated_user) {
                        if (err) { res.end(JSON.stringify(err)); }
                        callback(updated_user);
                    });
                });
            }
        }else{
            SystemSetting.findOne({ name: "th" }).exec(function (err, itseed_th) {
                if (err) { return res.end(JSON.stringify(err)); }
                if (itseed_th != undefined) {
                    newuser.th = itseed_th.value;
                }
                User.create(newuser)
                .exec(function (err, user) {
                    if (err) { res.end(JSON.stringify(err)); }
                    //新增DISC
                    UserDISC.create({ user: user.id })
                    .exec(function (err, disc) {
                        if (err) { res.end(JSON.stringify(err)); }
                        //新增報名資料
                        UserFiles.create({ user: user.id })
                        .exec(function (err, files) {
                            if (err) { res.end(JSON.stringify(err)); }
                            //連結table
                            User.update({
                                id: user.id
                            }, {
                                disc: disc.id,
                                files: files.id
                            })
                            .exec(function (err, data) {
                                if (err) { res.end(JSON.stringify(err)); }
                                User.findOne({
                                    id: user.id
                                }).exec(function (err, updated_user) {
                                    if (err) { res.end(JSON.stringify(err)); }
                                    callback(updated_user);
                                });
                            });
                        });
                    });
                });
            });
        }
    });
}

 module.exports = {
    //移除blueprint內建的actions
    _config: {
        actions: false,
        rest: false,
        shortcuts: false
    },

    /*前台*/
    
    // email驗證

    rem: function (req, res) {
        // var q = req.session.userid
        // if(req.session.userid){

        // var userregister ={

        // mailmd5 : md5(req.body.email),
        // email : req.body.email
        // }
        // emailV.findOne({
        //     mailmd5: md5(req.body.email)
        // })
        // .exec(function (err , emailvo) {
        //     if (err) {
                
        //         res.end(JSON.stringify(err));
        //     }else if(emailvo){
        //         Mailer.sendWelcomeMail(userregister);
        //         return res.view("frontend/pages/rem" , { emailV:userregister });
        //     }else{
        //         emailV.create(userregister)
        //         .exec(function(err, emailV) {
        //             if(err){
        //                 res.end(JSON.stringify(err));
        //             }
        //             else{
        //                 Mailer.sendWelcomeMail(userregister);
        //                 return res.view("frontend/pages/rem" , { emailV:emailV });
        //             }
        //         });
        //     }
        // });
        var nodemailer = require('nodemailer');

        var transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
           user: 'apple556621@gmail.com',
           pass: 'iuhmsgkrcmivemod'
         }
        });

            var mailOptions = {
            from: 'apple556621@gmail.com',
            to: 'apple5566221@gmail.com',
            subject: 'Sending Email using Node.js',
            text: 'That was easy!'
            };

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
           console.log('Email sent: ' + info.response);
          }
        });
    },
    reg:function (req,res){
        emailV.findOne({
            mailmd5: req.param('email')
        })
        .exec(function (err , emailV) {
            if (err) {
                res.end(JSON.stringify(err));
                
            }else if(emailV.mailmd5 == null){
                return res.view("frontend/pages/register" ,{emailV : null});
            }else{
                return res.view("frontend/pages/register", {
                    emailV:emailV
                });
            
            }
        });
    },
    //登入頁
    loginPage: function (req, res) {
        let redirect = req.query.redirect;
        //判斷系統開放與否
        SystemSetting.findOne({
            name: "startDate"
        })
        .exec(function (err, strStartDate) {
            if (err) {
                return res.end(JSON.stringify(err));
            }
            else {
                if (strStartDate == undefined)
                    startDate = "";
                else {
                    startDate = (new Date(strStartDate.value)).getTime();
                }

                SystemSetting.findOne({
                    name: "endDate"
                })
                .exec(function (err, strEndDate) {
                    if (err) {
                        return res.end(JSON.stringify(err));
                    }
                    else {
                        if (strEndDate == undefined)
                            endDate = "";
                        else {
                            endDate = (new Date(strEndDate.value)).getTime();
                        }
                        var now = (new Date()).getTime();
                        if (startDate < now && now < endDate){
                            //系統開放
                            return res.view("frontend/pages/login",{
                                redirect: redirect
                            });
                        } else if (startDate == "" || endDate == ""){
                            //還沒設定
                            return res.view("frontend/pages/login", {
                                redirect: redirect
                            });
                        }else{
                            //系統關閉
                            return res.redirect('/regInfo?system=close');
                        }
                    }
                });
            }
        });
    },
    //註冊
    register: function(req, res){
        //TODO: 系統開關
        var newuser = {
            email: req.body.email,
            pwd: md5(req.body.pwd),
        };
		registerAccount(res,newuser,function(user){
			req.session.userid = user.id;
            req.session.email = user.email;
            req.session.pwd = user.pwd;
			req.session.type =  user.type;
			req.session.authorized = {
				user: true
			};
        //註冊完寄送驗證信    
        var nodemailer = require('nodemailer');
        var host=req.get('host');
        var link="http://"+req.get('host')+"/mailverify?id="+req.session.userid;

        var transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
           user: 'apple556621@gmail.com',
           pass: 'iuhmsgkrcmivemod'
         }
        });

            var mailOptions = {
            from: 'apple556621@gmail.com',
            to: req.session.email,
            subject: '資訊種子註冊成功驗證信',
            html: "<p>親愛的報名者您好,</p><br><p>請點擊連結繼續完成註冊手續</p><a href="+link+"> 請點擊此連結 </a><br><p>第十六屆資訊種子招生團隊敬上</p>"
            };
// http://www.itseed.tw/register?email=<%= mailmd5 %>
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
           console.log('Email sent: ' + info.response +' 寄件的信箱為：'+req.session.email);
          }
        });
			res.redirect("/disc");  
        });                
    },
    mailverify: function(){
        console.log(req.protocol+":/"+req.get('host'));
        if((req.protocol+"://"+req.get('host'))==("http://"+host))
        {
            console.log("Domain is matched. Information is from Authentic email");
        if(req.query.id==req.session.userid)
        {
            console.log("email is verified");
            res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");
        }
        else
        {
            console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
        }
        else
        {
            res.end("<h1>Request is from unknown source");
        }
    },

    //檢查信箱是否已存在
    checkEmail: function (req, res) {
        User.findOne({
            email: req.body.email
        })
        .exec(function(err, user) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
                //註冊 or 修改信箱
                if(req.body.pwd == undefined){
                    if(user == undefined){
                        res.end("true");
                    }
                    else{
                        //修改信箱
                        if(req.session.email == req.body.email)
                            res.end("true");
                        else
                            res.end("false");
                    }   

                }
                //登入
                else{
                    if(user == undefined){
                        res.end("false");
                    }
                    else
                        res.end("true");
                }
            }
        });
    },
    //檢查密碼是否正確
    checkPwd: function (req, res) {
        User.findOne({
            email: req.body.email
        })
        .exec(function(err, user) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
                if(user == undefined){
                    res.end("false");
                }
                else{
                    if(md5(req.body.pwd) != user.pwd){
                        res.end("false");
                    }
                    else
                        res.end("true");
                }
            }
        });
    },
    //登入
    login: function (req, res) {
        User.findOne({
            email: req.body.email
        })
        .exec(function(err, user) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
                if(user == undefined){
                    return res.end("使用者不存在");
                }
                if(md5(req.body.pwd) != user.pwd){
                    return res.end("密碼錯誤");
                }

                req.session.userid = user.id;
                req.session.email = user.email;
                req.session.pwd = req.body.pwd;
                req.session.type =  user.type;
                req.session.authorized = {
                    user: true
                }
                //console.log(req.session);
                res.redirect(req.body.redirect!='undefined'? req.body.redirect: "/disc" ) ;
            }
        });
    },
    google_login: function (req, res) {
        const CLIENT_ID = process.env.googleLoginId;
        const OAuth2Client = require('google-auth-library').OAuth2Client;
        const client = new OAuth2Client(CLIENT_ID);
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: req.body.idtoken,
                audience: CLIENT_ID,
            });
			const payload = ticket.getPayload();
			const gIdToken = md5(payload.sub);
            User.findOne({
				gIdToken: gIdToken
            }).exec(function (err, user) {
                if (err) { return res.end(JSON.stringify(err)); }
                if (user == undefined) {
					const newuser = {
						email: payload.email,
						gIdToken: gIdToken
					}
					registerAccount(res, newuser, function (new_user) {
                        req.session.userid = new_user.id;
                        req.session.email = new_user.email;
                        req.session.gIdToken = new_user.gIdToken;
                        req.session.type = new_user.type;
                        req.session.authorized = {
                            user: true
                        }
                        res.end(JSON.stringify({
                            redirect: req.body.redirect != 'undefined' ? req.body.redirect:"/disc"
                        }));
					});
                }else{
					req.session.userid = user.id;
					req.session.email = payload.email;
                    req.session.gIdToken = gIdToken;
					req.session.type = user.type;
                    req.session.authorized = {
                        user: true
                    }
					res.end(JSON.stringify({
                        redirect: req.body.redirect != 'undefined' ? req.body.redirect : "/disc"
					}));
				}
            });  
        }
        verify().catch(console.error);   
    },
    //登出
    logout: function (req, res) {
        delete(req.session.userid);
        delete(req.session.email);
        delete(req.session.pwd);
        delete(req.session.type);
        delete(req.session.authorized);
        res.redirect("/");
    },
    //個人資料
    profile: function (req, res) {
        UserFiles.findOne({
            user: req.session.userid
        })
        .exec(function(err, files) {
            if(err){ res.end(JSON.stringify(err));}
            if(files == undefined){
                res.redirect('/logout');
            }
            var f = 0;
            if( files.finished != 1){
                files.finished = 0;
                if (files.registrationUT != null){
                    f += 1;
                    files.registrationUT = CmsService.formatTime(files.registrationUT);
                }
                if (files.autobiographyUT != null){
                    f += 1;
                    files.autobiographyUT = CmsService.formatTime(files.autobiographyUT);
                }
            }
            if(f == 2){
                // files.allFiles = 1;
                files.finished = 1;
            }
            //disc 顯示
            UserDISC.findOne({  
                user: req.session.userid
            })
            .exec(function (err, disc) {
                if (err) {
                    return res.end(JSON.stringify(err));
                }
                else {
                    User.findOne({
                        id: req.session.userid
                    })
                    .exec(function(err, user) {
                        if(err){
                            res.end(JSON.stringify(err));
                        }
                        else{
                            return res.view("frontend/pages/userProfile", {
                                user: user,
                                disc: disc,
                                files:files
                            });
                        }
                    });
                }
            });
        });
    },
    //編輯個人資料
    editProfile: function (req, res) {
        var t = 0;
        var value = {
            email: req.body.email,
            pwd: md5(req.body.pwd),
            phone: req.body.phone,
            name: req.body.name,
            gender: req.body.gender,
            school: req.body.school,
            grade: req.body.grade,
            reference: req.body.reference,
            survey: Array.isArray(req.body.survey) ? req.body.survey.join(',') : req.body.survey
        };
        if(value.name!=null && value.gender!=null && value.school!=null && value.grade!=null){
            // value.finished = 1 ;
            t++;
        }
        req.file("photo").upload({ dirname: sails.config.appPath+"/assets/files/"+req.session.userid}
            , function (err, uploadedFiles) {
                if (err) 
                    return res.end(JSON.stringify(err));
            //有上傳檔案
            if (uploadedFiles.length > 0) {
                //圖片檔
                if (uploadedFiles[0].type.substring(0, 5) == "image") { 

                    if (uploadedFiles[0].size > 2 * 1024 * 1024) {
                        return res.end("圖片大小須小於2MB");
                    }
                    var url = uploadedFiles[0].fd;
                    var start = url.search("files") - 1;
                    url = url.slice(start);
                    url = url.replace(/\\/g, "/");
                    value.photo = url;
                    t++;
                    // value.finished = 1;
                }
                if(t==2){
                    value.finished = 1;
                }
                //非圖片檔
                else {
                    fs.unlink(uploadedFiles[0].fd, function (err) {  
                        if (err) 
                            console.error(err) 
                    });  
                    return res.end("檔案格式錯誤");
                }      

                //取得舊照片位址
                User.findOne({
                    id: req.session.userid
                })
                .exec(function (err, user) {
                    if (err) {
                        res.end(JSON.stringify(err));
                    }
                    else {
                        var oldPhoto = user.photo;

                        User.update({id: user.id}, value)
                        .exec(function (err, datas) {
                            if (err) {
                                //刪除上傳檔案
                                fs.unlink(uploadedFiles[0].fd, function (err) {  
                                    if (err) 
                                        console.error(err) 
                                });  
                                
                                res.end(JSON.stringify(err));
                            }
                            else {
                                //刪除舊檔案
                                if (oldPhoto != "/images/layout/logo.png") {
                                    var imagePath = sails.config.appPath + "/assets" + oldPhoto;

                                    fs.unlink(imagePath, function (err) {  
                                        if (err) 
                                            console.error(err) 
                                    });  
                                }
                                // 複製到 public 讓使用者可以觀看
                                if (!fs.existsSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid)){
                                    fs.mkdirSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid);
                                }
                                var source = fs.createReadStream(sails.config.appPath + "/assets" + datas[0].photo);
                                var desti = fs.createWriteStream(sails.config.appPath + "/.tmp/public" + datas[0].photo);
                                source.pipe(desti);
                                source.on('end',function() {
                                    source.close();
                                    req.session.email = req.body.email;
                                    req.session.pwd = req.body.pwd;
                                    res.redirect("/profile");
                                });
                            }
                        });
                    }
                });             
            }
            //沒上傳檔案
            else{
                User.update({id: req.session.userid}, value)
                .exec(function (err, datas) {
                    if (err) {
                        res.end(JSON.stringify(err));
                    }
                    else {
                        req.session.email = req.body.email;
                        req.session.pwd = req.body.pwd;
                        res.redirect("/profile");
                    }     
                });
            }
        });
    },
    //DISC
    disc: function (req, res) {
        //================ 報名狀態顯示顯示
        User.findOne({
            id: req.session.userid
        })
        .exec(function(err, user) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
                //disc 顯示
                UserFiles.findOne({  
                    user: req.session.userid
                })
                .exec(function (err, files) {
                    if (err) {
                        return res.end(JSON.stringify(err));
                    }
                    else {
                        var f = 0;
                        if( files.finished != 1){
                            files.finished = 0;
                            if (files.registrationUT != null){
                                f += 1;
                                files.registrationUT = CmsService.formatTime(files.registrationUT);
                            }
                            if (files.autobiographyUT != null){
                                f += 1;
                                files.autobiographyUT = CmsService.formatTime(files.autobiographyUT);
                            }
                        }
                        if(f == 2){
                            // files.allFiles = 1;
                            files.finished = 1;
                        }
                        UserDISC.findOne({
                            user: req.session.userid
                        })
                        .exec(function(err, disc) {
                            if(err){
                                res.end(JSON.stringify(err));
                            }
                            else{
                                return res.view("frontend/pages/userDisc", {
                                    disc: disc,
                                    files:files,
                                    user:user
                                });
                            }
                        });
                }
                });
            }
        });  
    },
    //編輯DISC
    editDisc: function (req, res) {
        var value = {};
        var a =[ 0 , 0 , 0 , 0];
        for(var i = 1; i <= 10; i++){
            for (var j = 1; j <5 ; j++){ //計算動物
                if(req.body["q" + i] == j)
                    a[j-1] += 1;
            }
            var animal = ['老虎','孔雀','無尾熊','貓頭鷹'];
            value["a1"] = a[0] ;
            value["a2"] = a[1] ;
            value["a3"] = a[2] ;
            value["a4"] = a[3] ;
            value["animal"] = animal[a.indexOf(Math.max(a[0],a[1],a[2],a[3]))] ; //算動物最大值
            
            if(req.body["q" + i] == undefined)
                return res.end("測驗未完成");
            value["q" + i] = req.body["q" + i];
        }
        value["finished"] = 1; //未用到
        // window.alert('填寫完成');

        UserDISC.update({user: req.session.userid}, value)
        .exec(function (err, datas) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
                res.redirect("/disc");
            }
        });
    },

    confirm:function(req,res){
        var value ={};
        if (req.session.userid) {
            UserFiles.findOne({
                user: req.session.userid
            })
            .exec(function (err, files) {
                if (err) {
                    res.end(JSON.stringify(err));
                }
                else {
                    
                    if(files.finished==1){
                        files.confirm = 1;
                        value.confirm =1;
                    }
                    UserFiles.update({user: req.session.userid}, value)
                    .exec(function (err, datas) {
                        if(err){
                            res.end(JSON.stringify(err));
                        }else{
                            res.redirect("/files");
                        }
                    });
                    

                    
                }
            });
        }
    },

    
    
    //報名資料
    files: function (req, res) {
        var value = {};
        UserFiles.findOne({
            user: req.session.userid
        })
        .exec(function (err, files) {
            if (err) {
                res.end(JSON.stringify(err));
            }
            else {
                var f = 0; //判斷完成

                if( files.finished != 1){

                    files.finished = 0;
                    if (files.registrationUT != null){
                        f += 1;
                        files.registrationUT = CmsService.formatTime(files.registrationUT);
                    }
                    if (files.autobiographyUT != null){
                        f += 1;
                        files.autobiographyUT = CmsService.formatTime(files.autobiographyUT);
                    }
                }
                // if (files.receiptUT != null){
                //     f += 1;
                //     files.receiptUT = CmsService.formatTime(files.receiptUT);
                // }
                if(f == 2){
                    // files.allFiles = 1;
                    files.finished = 1;
                    value.finished = 1;
                }

                UserFiles.update({user: req.session.userid}, value)
                .exec(function (err, datas) {
                    if(err){
                        res.end(JSON.stringify(err));
                    }
                });

                var startDate, endDate;

                //判斷系統開放與否
                SystemSetting.findOne({
                    name: "startDate"
                })
                .exec(function (err, parameter1) {
                    if (err) {
                        return res.end(JSON.stringify(err));
                    }
                    else {
                        if (parameter1 == undefined)
                            startDate = "";
                        else {
                            startDate = (new Date(parameter1.value)).getTime();
                        }

                        SystemSetting.findOne({
                            name: "endDate"
                        })
                        .exec(function (err, parameter2) {
                            if (err) {
                                return res.end(JSON.stringify(err));
                            }
                            else {
                                if (parameter2 == undefined)
                                    endDate = "";
                                else {
                                    endDate = (new Date(parameter2.value)).getTime();
                                }
                                //================ 報名狀態顯示顯示
                                User.findOne({
                                    id: req.session.userid
                                })
                                .exec(function(err, user) {
                                    if(err){
                                        res.end(JSON.stringify(err));
                                    }
                                    else{
                                        //disc 顯示
                                        UserDISC.findOne({  
                                            user: req.session.userid
                                        })
                                        .exec(function (err, disc) {
                                            if (err) {
                                                return res.end(JSON.stringify(err));
                                            }
                                            else {

                                                //還沒設定
                                                if (startDate == "" || endDate == "") {
                                                    return res.view("frontend/pages/userFiles", {
                                                        system: "open",
                                                        files: files,
                                                        disc:disc,
                                                        user:user
                                                    });
                                                }
                                                else {
                                                    var now = (new Date()).getTime();
                                                    //系統開放
                                                    if (startDate < now && now < endDate){
                                                        return res.view("frontend/pages/userFiles", {
                                                            system: "open",
                                                            files: files,
                                                            disc:disc,
                                                            user:user
                                                        });
                                                    }
                                                    //系統關閉
                                                    else {
                                                        return res.view("frontend/pages/userFiles", {
                                                            system: "close",
                                                            files: files,
                                                            disc:disc,
                                                            user:user
                                                        });
                                                    }
                                                }

                                            }
                                        });
                                    }
                                });
                            //=======
                            }
                        });
                    }
                });
            }
        });
    },
    //上傳報名表
    uploadReg: function (req, res) {
        var value = {};
        //TODO: 系統開關
        var uploadOptions = {
            dirname: sails.config.appPath+"/assets/files/"+req.session.userid,
            saveAs: function (__newFileStream, cb) {
                var i = 0;
                var uploadFile = req.file("registration")._files[0].stream.filename;
                var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";
                
                //檔名重複時重新命名舊檔案
                if (fs.existsSync(newPath)) {
                    fs.renameSync(newPath, tmpPath)
                }
                cb(null, __newFileStream.filename);
            },
        }

        req.file("registration").upload(uploadOptions, function (err, uploadedFiles) {
            if (err) 
                return res.end(JSON.stringify(err));
            //有上傳檔案
            if (uploadedFiles.length > 0) {
                //PDF檔
                if (uploadedFiles[0].type == "application/pdf") {    
                    if (uploadedFiles[0].size > 5 * 1024 * 1024) {
                        return res.end("檔案需小於5MB");
                    }
                    var url = uploadedFiles[0].fd;
                    var start = url.search("files") - 1;
                    url = url.slice(start);
                    url = url.replace(/\\/g, "/");
                    value.registration = url;
                    value.registrationUT = new Date();
                }
                //非PDF檔
                else {
                    fs.unlink(uploadedFiles[0].fd, function (err) {  
                        if (err) 
                            console.error(err) 
                    });  
                    return res.end("檔案格式錯誤");
                }      

                //取得舊檔案位址
                UserFiles.findOne({
                    user: req.session.userid
                })
                .exec(function (err, file) {
                    if (err)
                        res.end(JSON.stringify(err));
                    else {
                        var oldFile = file.registration;

                        UserFiles.update({id: file.id}, value)
                        .exec(function (err, datas) {
                            var uploadFile = req.file("registration")._files[0].stream.filename;
                            var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                            var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";

                            if (err) {
                                //刪除上傳檔案
                                fs.unlink(uploadedFiles[0].fd, function (err) {  
                                    if (err) 
                                        console.error(err) 
                                });  

                                //還原舊檔案
                                if (fs.existsSync(tmpPath)) {
                                    fs.renameSync(tmpPath, newPath)
                                }
                                res.end(JSON.stringify(err));
                            }
                            else {
                                if(oldFile != null){                     
                                    var filePath = sails.config.appPath + "/assets" + oldFile;

                                    //刪除舊檔案
                                    if (fs.existsSync(tmpPath)) {
                                        fs.unlink(tmpPath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                    else {
                                        fs.unlink(filePath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                }
                                if (!fs.existsSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid)){
                                    fs.mkdirSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid);
                                }
                                var source = fs.createReadStream(sails.config.appPath + "/assets" + datas[0].registration);
                                var desti = fs.createWriteStream(sails.config.appPath + "/.tmp/public" + datas[0].registration);
                                source.pipe(desti);
                                source.on('end',function() {
                                    source.close();
                                    res.redirect("/files");
                                });
                            }
                        });
                    }
                });                        
            }
            //沒上傳檔案
            else{
                return res.end("未上傳檔案");
            }
        });
    },
    //上傳自傳
    uploadAut: function (req, res) {
        var value = {};

        //TODO: 系統開關
        var uploadOptions = {
            dirname: sails.config.appPath+"/assets/files/"+req.session.userid,
            saveAs: function (__newFileStream, cb) {
                var i = 0;
                var uploadFile = req.file("autobiography")._files[0].stream.filename;
                var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";
                
                //檔名重複時重新命名舊檔案
                if (fs.existsSync(newPath)) {
                    fs.renameSync(newPath, tmpPath)
                }
                cb(null, __newFileStream.filename);
            },
        }

        req.file("autobiography").upload(uploadOptions, function (err, uploadedFiles) {
            if (err) 
                return res.end(JSON.stringify(err));
            //有上傳檔案
            if (uploadedFiles.length > 0) {
                //PDF檔
                if (uploadedFiles[0].type == "application/pdf") {    
                    if (uploadedFiles[0].size > 5 * 1024 * 1024) {
                        return res.end("檔案需小於5MB");
                    }
                    var url = uploadedFiles[0].fd;
                    var start = url.search("files") - 1;
                    url = url.slice(start);
                    url = url.replace(/\\/g, "/");
                    value.autobiography = url;
                    value.autobiographyUT = new Date();
                }
                //非PDF檔
                else {
                    fs.unlink(uploadedFiles[0].fd, function (err) {  
                        if (err) 
                            console.error(err) 
                    });  
                    return res.end("檔案格式錯誤");
                }      

                //取得舊檔案位址
                UserFiles.findOne({
                    user: req.session.userid
                })
                .exec(function (err, file) {
                    if (err)
                        res.end(JSON.stringify(err));
                    else {
                        var oldFile = file.autobiography;

                        UserFiles.update({id: file.id}, value)
                        .exec(function (err, datas) {
                            var uploadFile = req.file("autobiography")._files[0].stream.filename;
                            var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                            var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";

                            if (err) {
                                //刪除上傳檔案
                                fs.unlink(uploadedFiles[0].fd, function (err) {  
                                    if (err) 
                                        console.error(err) 
                                });  
                                
                                //還原舊檔案
                                if (fs.existsSync(tmpPath)) {
                                    fs.renameSync(tmpPath, newPath)
                                }
                                res.end(JSON.stringify(err));
                            }
                            else {
                                if(oldFile != null){                     
                                    var filePath = sails.config.appPath + "/assets" + oldFile;

                                    //刪除舊檔案
                                    if (fs.existsSync(tmpPath)) {
                                        fs.unlink(tmpPath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                    else {
                                        fs.unlink(filePath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                }
                                if (!fs.existsSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid)){
                                    fs.mkdirSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid);
                                }
                                var source = fs.createReadStream(sails.config.appPath + "/assets" + datas[0].autobiography);
                                var desti = fs.createWriteStream(sails.config.appPath + "/.tmp/public" + datas[0].autobiography);
                                source.pipe(desti);
                                source.on('end',function() {
                                    source.close();
                                    res.redirect("/files");
                                });
                            }
                        });
                    }
                });                        
            }
            //沒上傳檔案
            else{
                return res.end("未上傳檔案");
            }
        });
    },
    //上傳匯款證明
    uploadRec: function (req, res) {
        var value = {};

        //TODO: 系統開關
        var uploadOptions = {
            dirname: sails.config.appPath+"/assets/files/"+req.session.userid,
            saveAs: function (__newFileStream, cb) {
                var i = 0;
                var uploadFile = req.file("receipt")._files[0].stream.filename;
                var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";
                
                //檔名重複時重新命名舊檔案
                if (fs.existsSync(newPath)) {
                    fs.renameSync(newPath, tmpPath)
                }
                cb(null, __newFileStream.filename);
            },
        }

        req.file("receipt").upload(uploadOptions, function (err, uploadedFiles) {
            if (err) 
                return res.end(JSON.stringify(err));
            //有上傳檔案
            if (uploadedFiles.length > 0) {
                //PDF檔
                if (uploadedFiles[0].type == "application/pdf") {    
                    if (uploadedFiles[0].size > 5 * 1024 * 1024) {
                        return res.end("檔案需小於5MB");
                    }
                    var url = uploadedFiles[0].fd;
                    var start = url.search("files") - 1;
                    url = url.slice(start);
                    url = url.replace(/\\/g, "/");
                    value.receipt = url;
                    value.receiptUT = new Date();
                }
                //非PDF檔
                else {
                    fs.unlink(uploadedFiles[0].fd, function (err) {  
                        if (err) 
                            console.error(err) 
                    });  
                    return res.end("檔案格式錯誤");
                }      

                //取得舊檔案位址
                UserFiles.findOne({
                    user: req.session.userid
                })
                .exec(function (err, file) {
                    if (err)
                        res.end(JSON.stringify(err));
                    else {
                        var oldFile = file.receipt;

                        UserFiles.update({id: file.id}, value)
                        .exec(function (err, datas) {
                            var uploadFile = req.file("receipt")._files[0].stream.filename;
                            var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                            var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";
                            
                            if (err) {
                                //刪除上傳檔案
                                fs.unlink(uploadedFiles[0].fd, function (err) {  
                                    if (err) 
                                        console.error(err) 
                                });  
                                
                                //還原舊檔案
                                if (fs.existsSync(tmpPath)) {
                                    fs.renameSync(tmpPath, newPath)
                                }
                                res.end(JSON.stringify(err));
                            }
                            else {
                                if(oldFile != null){                     
                                    var filePath = sails.config.appPath + "/assets" + oldFile;

                                    //刪除舊檔案
                                    if (fs.existsSync(tmpPath)) {
                                        fs.unlink(tmpPath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                    else {
                                        fs.unlink(filePath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                }
                                res.redirect("/files");
                            }
                        });
                    }
                });                        
            }
            //沒上傳檔案
            else{
                return res.end("未上傳檔案");
            }
        });
    },
};
