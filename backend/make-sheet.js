const {google} = require("googleapis");
const privatekey = require("./service_account.json");

class MakeSheet {
    async makeSheet(name, foldNameOrId, isFoldId = false) {
        console.log("Creating a sheet")

        let folderId = foldNameOrId;
        if (!isFoldId) {
            folderId = this.FOLDER_IDS[foldNameOrId];
        }

        let jwtClient = this.authorizeGoogle();

        const sheets = google.sheets({version: 'v4', auth: jwtClient});

        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();

        let title = year + "-" + month + "-" + date + " " + name;

        const resource = {
            properties: {
                title: title,
            },
        };
        let response = await sheets.spreadsheets.create({
            resource,
            fields: 'spreadsheetId',
        });

        console.log("the id in here", response.data.spreadsheetId);

        //const MakeSheet = require("./make-sheet");
        //const makeSheet = new MakeSheet();

        console.log(`Moving ${response.data.spreadsheetId} into ${folderId}`);
        let moveResult = await this.moveSheet(response.data.spreadsheetId, folderId, jwtClient);
        if (moveResult !== undefined) {
            return "folder id is invalid";
        }
        this.addHeader(response.data.spreadsheetId, jwtClient);
        this.formatSheet(response.data.spreadsheetId, jwtClient);
        //return res.status(200).json({id: response.data.spreadsheetId});
        return response.data.spreadsheetId;
    }
    async fillSheet(fileId, info) {
        console.log("Filling in the sheet!!")
        //info = JSON.parse(info);
        //console.log("Adding a new row for " + info.title);

        let jwtClient = this.authorizeGoogle();
        let sheets = google.sheets({version: 'v4', auth: jwtClient});

        let values = [];

        for (let i = 0; i < info.length; i++) {
            if (info[i] === "nope") {
                continue;
            }

            //console.log("Adding row for " + info[i].title);
            let vidTitle = (info[i].title).replace(/["]+/g, '');
            let linkTitle = '=HYPERLINK("' + info[i].url + '", "' + vidTitle + '")';
            values.push([linkTitle, info[i].date, info[i].dur, info[i].cap, info[i].views, info[i].profile])
        }

        const resource = {
            values,
        };

        //let range = "Sheet1!A" + (vidNum + 2) + ":F" + (vidNum + 2);
        let range = "Sheet1!A" + (2) + ":F" + (2);

        sheets.spreadsheets.values.append({
            spreadsheetId: fileId,
            range: range,
            valueInputOption: "user_entered",
            resource: resource
        }, function (err, response) {
            if (err) {
                console.log('The API returned an error. ' + err);
            } else {
                //console.log('Result:');
                //console.log(response.data);
            }
        });

    }

    async fillSheetWebhook(fileId, info) {

        //let jwtClient = this.authorizeGoogle();
        //let sheets = google.sheets({version: 'v4', auth: jwtClient});

        let values = [];

        return Promise.all(info).then((vidInfo) => {
            //console.log("Filling in the sheet with " + vidInfo)
            for (let i = 0; i < info.length; i++) {
                if (vidInfo[i] === 'nope') {
                    continue;
                }

                //console.log("Adding row for " + vidInfo[i].title);
                let vidTitle = (vidInfo[i].title).replace(/["]+/g, '');
                let linkTitle = '=HYPERLINK("' + vidInfo[i].url + '", "' + vidTitle + '")';
                values.push([linkTitle, vidInfo[i].date, vidInfo[i].dur, vidInfo[i].cap, vidInfo[i].views, vidInfo[i].profile]);
            }

            const resource = {
                values,
            };

            let range = "Sheet1!A" + (2) + ":F" + (2);

            console.log("Now we're filling in the sheet");
            let jwtClient = this.authorizeGoogle();
            let sheets = google.sheets({version: 'v4', auth: jwtClient});

            let result = {status: "working"};

            sheets.spreadsheets.values.append({
                spreadsheetId: fileId,
                range: range,
                valueInputOption: "user_entered",
                resource: resource
            }, function (err, response) {
                if (err) {
                    console.log('The API returned an error. ' + err);
                    //return {error: err.message};
                    result = {error: err.message};
                } else {
                    result = {status: "successful"};
                }
            });
            return result;
        })
            .catch(err => {
                console.log(`There was an error filling in the sheet: ${err.message}`);
                return {error: err.message};
            });

    }

    async moveSheet(id, folderId, jwtClient) {
        //console.log("Moving the sheet!!");
        //let jwtClient = authorizeGoogle();
        const service = google.drive({version: 'v3', auth: jwtClient});
        try {
            // Retrieve the existing parents to remove
            const file = await service.files.get({
                fileId: id,
                fields: 'parents',
            });

            // Move the file to the new folder
            const previousParents = file.data.parents
                .join(',');
            const files = await service.files.update({
                fileId: id,
                addParents: folderId,
                removeParents: previousParents,
                fields: 'id, parents',
            });
            //console.log(files.status);
            //console.log("Here is the spreadsheet id from within moveSheet: " + id);
            return undefined;
        } catch (err) {
            console.log("Error while moving the sheet.", err.message);
            if (err.message.startsWith("File not found:")) {
                console.log("Folder id is invalid.");
                return "folder id is invalid";
            }
            //throw err;
        }
    }


    async addHeader(id, jwtClient) {
        let sheets = google.sheets({version: 'v4', auth: jwtClient});

        let values = [
            ["Video Title", "Date", "Duration", "Captioned", "Views", "Live Stream"]
        ];
        const resource = {
            values,
        };

        let range = "Sheet1!A1:F1";

        sheets.spreadsheets.values.append({
            spreadsheetId: id,
            range: range,
            valueInputOption: "user_entered",
            resource: resource
        }, function (err, response) {
            if (err) {
                console.log('The API returned an error. ' + err);
            } else {
                //console.log('Result:');
                //console.log(response.data)
            }
        });
    }

    async formatSheet(id, jwtClient) {
        let service = google.sheets({version: 'v4', auth: jwtClient});
        const myRange = {
            sheetId: 0
        };
        const headerRange = {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0
        }
        const requests = [
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [myRange],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{userEnteredValue: 'Yes'}],
                            },
                            format: {
                                textFormat: {foregroundColor: {green: 0.6}},
                            },
                        },
                    },
                    index: 0,
                },
            },
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [myRange],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{userEnteredValue: 'No'}],
                            },
                            format: {
                                textFormat: {foregroundColor: {red: 0.8}},
                            },
                        },
                    },
                    index: 1,
                },
            },
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [headerRange],
                        booleanRule: {
                            condition: {
                                type: 'NOT_BLANK',
                            },
                            format: {
                                textFormat: {bold: true},
                            },
                        },
                    },
                    index: 2,
                },
            },
            {
                updateSheetProperties: {
                    properties: {
                        sheetId: 0,
                        gridProperties: {
                            frozenRowCount: 1
                        }
                    },
                    fields: "gridProperties.frozenRowCount"
                }
            }
        ];
        const resource = {
            requests,
        };
        try {
            const response = await service.spreadsheets.batchUpdate({
                spreadsheetId: id,
                resource,
            });
            //console.log(`${response.data.replies.length} cells updated.`);
            return response;
        } catch (err) {
            console.log(err);
            //throw err;
        }

    }

    authorizeGoogle() {
        let jwtClient = new google.auth.JWT(
            privatekey.client_email,
            null,
            privatekey.private_key,
            ['https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.metadata']);
        //authenticate request
        jwtClient.authorize(function (err, tokens) {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully connected!");
            }
        });
        return jwtClient;
    }

    FOLDER_IDS = {
        "Test 1": "1-zaZ8NACPMCdOKMosR-mei-TjEA77i3W",
        "Test 2": "1CdXZn20E2jhsLpzH3oH-dpsxTpBP27Fx",
        "Abandoned - Audiology": "1I9CnBxQLgiFv7yueIbkIdHKXZZP6-JWJ",
        "International Ambassadors": "1U3wVrv1nsuilWUO-YItWvm_7mRzxZOFD",
        "Intersections": "1MVGywVlggK3ovsXqcMTPdNybxW3dB8Os",
        "TechComm - Old": "1XYODwBJ4SmuZ8FKOvAZ68bSEmgrrqZTd",
        "USU Center for Women & Gender": "18VnT0VQPV8CIJiL8zDpTuYkoIZxaeuu0",
        "USU Eastern Athletics": "1QWZTfAAoGdqusrsZ3ccNQMKJYTgZBV86",
        "USU Eastern Blanding Campus": "1Om3IYL2pJ2OTA4jVytNbQ8_q6G00HZdY",
        "USU Moab Campus": "1U8fnFJHl_xF3QTnwCVI_iVdTk7idJ8yk",
        "Utah State University - Regional Campuses": "1S5BzKE7_GbTAZF161sFpVL73E348Wl5B",

        "Aggie Funded": "1e1t50envTAbYN74qilSnBVsX4sKTldyb",
        "Alumni": "1Pskojb4nyw81OkMrqW1mZciqNg0ptciB",
        "Crowdfunding": "1ddsjWHTpw2NA4l16XDHVZHv4D31eCalj",

        "Athletics": "14BZScqRzUTWjh_MjPn-QtA_twoQugQ6k",
        "Football": "1uPZqX-HZvk6xFtGpst6LVAe0nLqTseRN",
        "Gymnastics": "1GLmHCMyaRH4jCAVc4abiTVeY1PFgMMD6",
        "SAAC": "1s-oIA6X_vondhZjQAb56cAjXvQ-yIoy2",
        "Strength and Conditioning": "1ryR8sepZDL4jzk18izomBv_i1Ifa3d1r",
        "Womens Soccer": "1WmigxGH9-FWap7alNcfxyXKjKX6gFEpD",

        "Aggie Chocolate": "1mIZWyuJLrYdMxUkSh0gU9AoYQTaF1DQa",
        "ASTE": "1hp2oreCtC3hBoFbl0URyvJYli5kzCi2b",
        "CAAS": "1gEG5BXv5tTgvOPewFramWzxRhcECc9qy",
        "Crop Physiology": "1iMa1RrnnLBFDx988Zfp44SLpf45BVTLs",
        "LAEP": "1tKgoxRLsGkkiWcBL7LAwedG4BenvdRll",
        "LAEP 2022": "1oar16cozLDMYdi34w19ERS4mmh0dV30q",
        "LAEPUSU": "1RQfLrGcEJ-nbYEr-ALaKg88jI8-s0IdD",
        "OPDD": "1oMdNMvmywepg49RFv5YSLHyV0RgilMLv",
        "SPARC": "1CjAHcpILrMAvZ5OqD4h4QjgJ2pNbXSoq",
        "USU MDA": "1rArY71BED1aVYFy21nXyUonhHBQ_M4o-",

        "Arts Access": "1WNQ1fvKsmt-NON5BifkFDMYuXS4Rjx2N",
        "CCA": "1sgxkNO3uRfV90_xxyGKhaWohL4bMhpaX",
        "Chamber Singers": "17YFq3niLGdybjCKKSqMwGxezteXEQ7--",
        "Jazz Orchestra": "13HpPIemBjrB9KEWJzt6eOXRSGmYlQaJ9",
        "Music": "1hIa15V5z9XfmXkRiGtZLBb239Z_XdxTs",
        "Symphony Orchestra": "1XICsU9F7erP6IUDGjR8LOxVOwTkoauH-",
        "Theatre": "1YMUpbkTyArUHR3KM8-aoxivMrgMpbHY3",
        "Theatre Arts": "1zzTOOFVb9XjC_DqpobE0Z2Bb1bBY8ZOK",
        "USU Opera": "1K4HGa1C7wsdrbHxAoFQucGCPFvok9alx",
        "Youth Conservatory": "1rK_hr_i0o-KjH4_NU2gle-dc_utSzrd4",

        "Aggies Elevated": "1DQcAovgPTU2Fyq8_-Kzu6vto41JbRMVT",
        "ASSERT": "1NWkq8e_gALOFL935fkiK7xOcRynAKoKJ",
        "CEHS - Audiology": "11NgXgztXwQDdZ8ihMTMrLBdyYn0q6cvw",
        "CEHS": "1AhFJ5K5OBn29rFr--9mQQDGHtC8F0dqt",
        "COMD": "1xrTd8JreJqkREwwhSTtc5bttTRG6B0Pm",
        "GEAR UP": "1aWaYSXZgl4gWJ9zrPl0jg-zHEAmP_GfX",
        "GEAR UP CCSD": "1z-pIcdA-gyaNVkjygyoLfKSrVU36gLMz",
        "HDFS": "1eGQUkIiLSei7E0PSopjlEOA31VGATzwV",
        "Health Education": "1DG2G6Tcw7vq8rF3oMm83JruwVB57EGK0",
        "Institute for Disability": "1sWidW-tF3YLxV708PLf_WOGy3zaEW0QZ",
        "ITLS": "1WhMuZV-VLBh8vl9qRpl-CAfJJwt2GEQA",
        "Kinesiology": "1FGRY0xKw_oqVKQp8lXV07bPblYJaWJLw",
        "TEAL": "18vZRoclbOtT8fkGoq87JyxpTQGHJ0kRq",
        "UATP": "1fAlRpZ1HaiI3mplLXyfLBxY-tcD6tVg3",
        "WebAIM": "1O_VPkFIYrqcF6DBCLdC73rYvNT-YgPUA",

        "AggieTV": "14tk_4k5L_Goz80qvR157qm0nr4AIwvnO",
        "CHASS": "1Crrvt1CiThChzDoFCl2U9LB7fyBvpT7s",
        "Communication Studies": "1EZqPfE2f6k1jFg05_nWhIqRNuteLbcit",
        "History": "1Mb1cNW709Yh7EygbvzX-PP2KZ6PkTwe2",
        "I-System": "1GnLw6TWiVmi2REeIcD5gNQBf1ObUc3gI",
        "IELI": "10-B04dDjTkQZYIIbdhp3EMaYzHI_0xFb",
        "Interfaith Fellows": "1N5iAW2xiAwVaNVdIStdsVjxqHPMPIToj",
        "Museum": "1abghrYXiPASyWEbFaneqpFTNynO_IcJJ",
        "SAAVI": "1h12vL0hYb2HzTjukc9EUQubkCWrZFkCB",
        "TechComm": "1te0nRO9HCCy0aGhzMjK-eZsiHm1_FDdL",
        "UPR": "1oPne4GvpxNOqYTUFY3FlQ9xry5h2M_4s",
        "Writing Center": "1ouiuwbi9mlWezUa7kvjzHO7OdZZde7iF",

        "College of Veterinary Medicine": "1KzVLUNky3eZx0vujFnV7NpIPQTj3Uf7k",

        "Inclusion Center": "1m8jYBvtJRlDBGa475CieHgHfKqNeoJ9M",

        "Eastern": "1KDFkyBQPjBad4XYqVPjZbYxXXoGZqPVP",
        "Eastern Spirit Squad": "1zrPNkP0SX3IzTX4yaU0ZXAcXI1Kf_SgT",

        "ASPIRE": "1U9WYj3xM5dxlSJ3iYeXqDDF3a2IwuRtk",
        "Engineering": "1GoylLnB3Hi-pf2ym7wE0G2lZbl6lSogu",
        "Fluid Dynamics": "1Z6f2RGYWxvKwYuCqZc4ug7o1TwhKY6H9",
        "USU Aerolab": "1uvVoHm6ojyRYIKlgFiZRnTfDeDBxtc8b",
        "Water Research Library": "1xLNx42oF6Lngpj1USmDVAaKbnk2qby8u",

        "Academic Success": "1SPcAfp-BC9kVNi7nE4IbsCf-tiBQKTiD",
        "Accessibility Services": "1v2IyJS5J5wjFoYvabTlAeOT-C9y68vHW",
        "Classroom Technology": "1n8iRE-sruZFUT3By1-JuRyZ3PZQxdEVx",
        "Collaborative": "1Si_-RZdlgSiokOeQDTscGNGmE1Tq_jMD",
        "Connections": "1Q4Bhdh-R98morHDHvSti-rc5GbRHqq1v",
        "Facilitator": "1DfS5nJ2-tqLQBlwBP5iPIvCFm685jrv8",
        "NEH Museum": "1pxsLa-Ka1C_TuYs12tVgjAaydNZaHiKZ",
        "Student Collaborative": "1Qy2jNCKG7OmpYl0I0uEehaUQXQD0Vn60",
        "USU Student Success": "17BOOlSvKz0JfjpU2BaLpwJccgO-sqJiA",

        "Create Better Health": "1AaQL-zgcQ3iM9DVAdKWj60JX7jePlJYO",
        "Extension": "1s3W3Y_4pQB66NVM1xikl_-p8SgGP7psQ",
        "Forestry": "1y5Vl-Z2lKyXgnLwyj4pxyzS9wkr5c3pr",
        "Health Equity": "1ryWBXCPkvMJ5fcSkt2krRIpss0ZB_vaA",
        "Healthy Relationships": "1cmXgw-AdleeY5L7XS65KY0UXswT6HxMs",
        "IORT": "1joqKCEzadpYgzwUIwzXXGyDzfIjuMOqg",
        "Kane County 4-H": "1Qz_k5Z8_KOSIBZg7X9vO2Wd3nCWhWuem",
        "Master Naturalist": "1Hv7ZxCILGTCnQ7SDh_Km8u3TUJcUGNVl",
        "Office of Health Equity and Community Engagement": "1QKqnhmTLLMJRup4QXY4bbNmgkPe9pNuB",
        "ROI": "1-uXOXa8rVG6n2FqMgmvLIgEb2a_q2DHb",
        "SBDC": "1dhhgwlPHHpYqh6lmVIp8xDX9bc2azAvt",
        "Small Farms": "1YzRrrawdH28F9jL1OqWy815G4LrsLEMs",
        "Swaner Ecocenter": "1vBesp8nCGMvh3y3IHCjfaTE-DoGWJ5Dn",
        "TeachAg": "1xlaQ32WOD2xiGita8PiG66p4oXS5FtxD",
        "Utah 4H": "14RRHT5ZS4zRX6_bpXqQSUCi4VALjRLak",
        "Utah Ag Classroom": "1zDUXvBLQCZLqp3VheqwIxf1eRU7YYkdp",
        "Utah County 4H": "1tpE4JxDCmkNEbS88jPYK9Zhjtf309Ta4",
        "Utah Marriage Commission": "1hmyv7NrKb2Jp-e3L3kFmjuUL2qooHpAz",
        "Utah Pests": "1tGNFcRsv8DuKMHlTHA2efruZi1Z5T-J3",
        "Water Quality": "1yQOh8UR6CsM5KxlQEhjvvwMjRUwOypRb",
        "Water Watch": "1AmQg_MuGhAYuKhfjEzNCml21kMDWUE1j",

        "USU Blue Goes Green": "1_Idd_ACb2RB4WKkKLTKTyeMuGefQmQs2",

        "Aggie Print": "1LGvCR37iW-aw8vc1leMDNN1I8IQ7ZhmS",
        "Dining": "1efySZCS-hNdzC8Hlolvr5HSoIsDb2v9P",
        "Event Services": "1MRh75t0QTt-W3MlQd6su74nbJ0dCape7",
        "Housing": "1Q3-THDjQipFWZkvMAI2u7bPxN5ePRqQK",
        "HR": "1LxgLRjd6U2hewuLHX8eVTkncBcCxRtt2",
        "IT": "1hIKnXi2qwT0QUMmjXm3CplbCe80CZW3s",
        "SEA": "1znx_IYqwVFUzJ1JGZK9ZzeAA5uALfTYk",

        "IOGP": "1T6FHzy2ji9xbOfB5WCVuccJduwLnLwsc",

        "DeBug": "12LU7afDm7_L0AVq9_U86Irj0p-5vxYYl",
        "Huntsman": "1lgjJm0h4ESX-BtwCpBPmOIpyCyHp77VG",
        "Shingo Institute": "19-VSY6rrW27jxM8uMvGIMkln_R0hCbeq",
        "UWLP": "1m7Wa_AceFc-OvHPNTiSefEMu3kd8xkM2",

        "Chemistry Unleashed": "1G3keL7SWXyt7wRGFp6nNpAPCSStd6fvs",
        "Physics Demos": "1JX3oIgglvLrA8q_-gllT77Rtb4wtXTHX",

        "Digital Commons": "1LHpenQiot_A_iisxxZEAu2Kc2f75vD66",
        "Digital Library": "1txGnOsp3KI86Vj-fSvlv-PVCJRzKkRuI",
        "Libraries": "1EDuFOACrMj-anDSSxUB5lq7akNW_t2I0",

        "SDL": "1OC2Bl4IgLkhtnKAeHBzxtPT5VJbwxkJm",

        "Career Design Center": "1ne3DXpg_Q0jMrpjyGDLPqD6wbF3EQUtW",
        "ETE": "1oivBRWWmfHBG6dsB-c2FFw7ho4wVzd3J",
        "Global Engagement": "1LIynnje_H7JqQE0sAghei9IWs0X8Ac6M",
        "Graduate School": "1I_q7h9yT3nnSSAlflqCxr6wLYnS73NJ4",
        "Honors": "1Kc9vQBBwX6Idv88VymD0N0ylLYumA0XW",
        "Indian SA": "1NXY3m1K2T9vHl_fpkIkJ889hG7enRBry",
        "Registrar": "12X5X254PntYCD8_WT7TQ31tfhgV1AC5E",
        "Writing Fellows": "14dEf90TodBvohnj8YuH4XPZoVjUWbDBK",

        "Center for Colorado River Studies": "1bu8YQYWxR1ZDF5PaW1n5kAPyRrm0hr7_",
        "Ecology Center": "1wZZ1l8IrLPfZrt-5OXKQumWewy6yAhK-",
        "GNAR": "1zlRd4Cht5gO5E3cEi97dJmQM1JnSC0EP",
        "QCNR": "1qGZC7K-JNGKG7AXfK84_91T4W86KKvYU",
        "Smart Foodscapes": "1K9d_-FUJ99vJnZNDasXux4Hxjj7aK3LN",
        "Watershed Sciences": "1B6h9xbkYn1Bvaht2KVfMmk51LAwl-Npo",

        "JQL Institute for Land, Water, and Air at USU": "1Lt8k-ZQoKUQAY_QZOJ3O_E7TXlFXBQ83",
        "Research": "1FaElLfCeq7niBi0n5reavaHoRx-_yjFg",

        "Aggie Math": "1lkx9rPg6V0xNv_-UEWJXD2P6dHllZYnL",
        "College of Science": "1rbYwel-1EL822UHn3tbbbEK4hHoxtmo3",
        "Computer Science": "1-jTLos43CO4jACY_1csQ2xV_WRky3Igp",
        "Geosciences": "10VxX1MXAjR09VflUz4GWJEGMk7HWMqJh",
        "Math Statistics": "1LRwxgcQ8KLHWFxzoeNTO9XgEY3QMclRf",

        "aggiementalhealth": "1MF5mrI4qaGs2hIEd88aC50tMtHHtQYp3",
        "Aggiepella": "1vRpy7PlAciChu58yJuO7Zl97YydgEiQE",
        "Algo Trading Club": "1cnRhCKzF2G8wmlcRFv_-CSikXa7gl726",
        "Campus Recreation": "1_pxAcvJw14YuwmZlAfj94iOVQCZTVBSA",
        "CAPS": "16quhZHB1apN5ou9foLlrP1r4NCbQ1l20",
        "Country Swing": "16udv702kfYQ1oBOGkYqm4063ntlFvcsP",
        "ESports": "1WIm8J91jbBbX_9cHPjfcSd55fVYW7vWH",
        "Hockey": "1mKJ6UHdDQxrn51g1QADwbLzcfMv74xlk",
        "HURD": "1rFicQMskwT6tPBzBAUD_Q0cOkd9WTcEl",
        "Mens Ultimate": "1gU3qo1Tj_aW85d4DSNudWjNy1aWVaeqD",
        "Mens Volleyball": "135555niej8jnmlpl8Xh9jecs_zpKZ2Dq",
        "Pickleball": "1D11k4j_g0B8tljTbisKLzr0DVTB-dnNb",
        "Quidditch": "1RaLLxxrmCKbqQ2rrXe9oHYmIrq2BOd7V",
        "Rugby": "1vxKRE31GhHQ_InRHbcW-cQUG-hWP-2HM",
        "SLC": "1dYAJALR_rOAoAztabjkHHwayYEskBUcB",
        "Soccer": "1qgtdHZIJojleJZBAiZZ6tMcIYpPBKsN7",
        "Social Action & Sustainability": "19M1-ahfnDwij4UAyYo-5ZAH-0KKl5Qf3",
        "Spirit Squad": "1E-_XevX-V8-loCXoOerx--XDc_Pt4kVO",
        "Star Wars Club": "1rOOBDfCowGtm3sB69NzPpQmOc_8Mv8iI",
        "Student Media": "1FZClg0iGGjSv3y4__nbY3U6BD34L0klv",
        "UCC": "1rNjHBVd92h4bopTlP5sdUJEl24vlwSML",

        "USU": "1ygQMeeV7F0JhdjI6VvSxQYaiIWiGKWMn",
        "USUNews": "1BGZrmwd8IZYKSXa9kW0vGVrH58tpkv2T",
        "The Center for Growth and Opportunity at Utah State University": "1IIm65Mg1LPSAHGIhdK0yaA4bxwSzy5kt",
        "Training and Development": "1c7IoVMt41mAcTKZ256deLI8Xn_cGsd_h",
    }

}

module.exports = MakeSheet;