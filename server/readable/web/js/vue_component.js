/*
Copyright 2020 NEC Solution Innovators, Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

Vue.component('goodjob-thanks-counter', {
    props: ['total'],
    template: '\
        <table style="width:100%">\
            <tbody style="font-size:1.3rem;">\
                <tr style="text-align:center">\
                    <td data-toggle="tooltip" data-html="true" data-original-title="いいね!獲得数<br>今年度の獲得数(総獲得数)">\
                      <i class="fa fa-thumbs-o-up"></i> {{ total.goodjob_count }}({{ total.goodjob_all_count }})\
                    </td>\
                    <td data-toggle="tooltip" data-html="true" data-original-title="サンクスポイント獲得数<br>今年度の獲得数(総獲得数)">\
                      <i class="fa fa-heart-o"></i> {{ total.thanks_count }}({{ total.thanks_all_count }})\
                    </td>\
                </tr>\
            </tbody>\
        </table>\
    ',
    methods: {
        openGoodJobRankingDialog: function(){
            var _pointRankingView = new DialogPointRankingView(0);
            _pointRankingView.showDialog();
        },
        openEmotionPointRankingDialog: function(){
            var _pointRankingView = new DialogPointRankingView(1);
            _pointRankingView.showDialog();
        }
    }
});