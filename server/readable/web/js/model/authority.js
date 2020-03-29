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
function AuthorityInfo() {
    this._roleId = null;
    this._roleName = null;
    this._rights = null;

};(function() {

    var _authorityInfo = new AuthorityInfo();
    AuthorityInfo.getInstance = function(){
        return _authorityInfo;
    }

    var _proto = AuthorityInfo.prototype;

    _proto.getRoleId = function() {
        return this._roleId;
    };

    _proto.setRoleId = function(roleId) {
        if(roleId == null || typeof roleId != 'string') {
            return;
        }
        this._roleId = roleId;
    };
    _proto.getRoleName = function() {
        return this._roleName;
    };
    _proto.setRoleName = function(roleName) {
        if(roleName == null || typeof roleName != 'string') {
            return;
        }
        this._roleName = roleName;
    };
    _proto.getRights = function() {
        return this._rights;
    };
    _proto.setRights = function(rights) {
        if(rights == null || typeof rights != 'object') {
            return;
        }
        this._rights = rights;
    };

    _proto.removeRightForResource = function(action, resource) {
        if(action == null || typeof action != 'string'){
            return false;
        }
        if (resource == null || typeof resource != 'string') {
            return false;
        }
        let _idx = 0;
        let _found = false;
        for(;_idx < this._rights.length; ++_idx){
            if(this._rights[_idx].hasOwnProperty('resource') && this._rights[_idx].resource == resource){
                _found = true;
                break;
            }
        }
        if (_found) {
            this._rights.splice(_idx, 1);
        }
        return _found;
    }

    _proto.setRightForResource = function(action, resource) {
        if(action == null || typeof action != 'string'){
            return false;
        }
        if (resource == null || typeof resource != 'string') {
            return false;
        }
        for( let right of this._rights ){
            if(right.hasOwnProperty('resource') && right.resource == resource){
                right.action = action;
                return true;
            }
        }
        this._rights.push({
            action: action,
            resource: resource,
            enable_flag: true
        });
        return true;
    }

    _proto.checkRights = function(action, resource=null){
        if(action == null || typeof action != 'string') {
            return false;
        }
        if(resource != null && typeof resource != 'string'){
            return false;
        }

        if(resource == null){
            for(let right of this._rights ){
                if(right.hasOwnProperty('action') && !right.hasOwnProperty('resource') && right.action == action ){
                    return true;
                }
            }
        }else{
            for( let right of this._rights ){
                if(right.hasOwnProperty('action') && right.hasOwnProperty('resource')
                && right.action == action && right.resource == resource){
                    return true;
                }
            }
        }
        return false;
    };

    _proto.getWhichRightToResource = function(actions, resource) {
        if (actions == null || typeof actions != 'object') {
            return null;
        }
        if (resource == null || typeof resource != 'string' || resource == '') {
            return null;
        }
        let _self = this;
        for (let action of actions) {
            for( let right of _self._rights ){
                if(right.hasOwnProperty('action') && right.hasOwnProperty('resource')
                && right.action == action && right.resource == resource){
                    return action;
                }
            }
        };
        return null;
    }

    _proto.getWhichRightToGroupchatResource = function(resource) {
        if (resource == null || typeof resource != 'string' || resource == '') {
            return null;
        }
        let _self = this;
        let actions = [
            AuthorityDef.AUTHORITY_ACTIONS.GC_MANAGE,
            AuthorityDef.AUTHORITY_ACTIONS.GC_SEND,
            AuthorityDef.AUTHORITY_ACTIONS.GC_VIEW
        ];
        return _self.getWhichRightToResource(actions, resource);
    }

    _proto.getWhichRightToCommunityResource = function(resource) {
        if (resource == null || typeof resource != 'string' || resource == '') {
            return null;
        }
        let _self = this;
        let actions = [
            AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE,
            AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_SEND,
            AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_VIEW
        ];
        return _self.getWhichRightToResource(actions, resource);
    }
})();

function AuthorityDef() {
};(function() {
    AuthorityDef.AUTHORITY_ACTIONS = {
        FEED_VIEW: 'viewMessageInFeed',
        FEED_SEND: 'sendMessageToFeed',
        GC_VIEW: 'viewMessageInGroupchat',
        GC_SEND: 'sendMessageToGroupchat',
        GC_MANAGE: 'manageGroupchat',
        GC_CREATE: 'createGroupchat',
        COMMUNITY_VIEW: 'viewMessageInCommunity',
        COMMUNITY_SEND: 'sendMessageToCommunity',
        COMMUNITY_MANAGE: 'manageCommunity',
        COMMUNITY_CREATE: 'createCommunity',
        MURMUR_VIEW: 'viewMessageInMurmur',
        MURMUR_SEND: 'sendMessageToMurmur'
    }

})();

try {
  module.exports = AuthorityInfo
} catch(e){
}
