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

package jp.co.nec.necst.spf.globalSNS.ContextHub;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Note;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;

public class NoteAdapter {
    private static final Logger Log = LoggerFactory
        .getLogger(NoteAdapter.class);
    private static NoteAdapter mNoteAdapter = null;

    private NoteAdapter() {
    }

    public static NoteAdapter getInstance() {
        Log.debug("do func NoteAdapter.getInstance(...");
        if (mNoteAdapter == null) {
            mNoteAdapter = new NoteAdapter();
        }
        return mNoteAdapter;
    }

    public Element getNoteElement(Note noteData) {
        Log.debug("do func NoteAdapter.getNoteElement(...");
        Element note = DocumentHelper.createElement("note_codimd");
        if (noteData == null) {
            Log.info("NoteAdapter#getNoteElement::noteData is null.");
            return note;
        }
        Element noteItem = getNoteItemElement(noteData);
        if (noteItem == null) {
            Log.error("NoteAdapter#getNoteElement::noteItem is null.");
            return note;
        }
        note.add(noteItem);
        return note;
    }

    public Element getNoteItemElement(Note noteData) {
        Log.debug("do func NoteAdapter.getNoteItemElement(...");
        if (noteData == null) {
            Log.error("NoteAdapter#getNoteItemElement::noteData is null.");
            return null;
        }
        Element noteItem = DocumentHelper.createElement("item");

        noteItem.addAttribute("note_title", noteData.getTitle());

        noteItem.addAttribute("note_url", noteData.getNoteUrl());

        noteItem.addAttribute("thread_root_id", noteData.getThreadRootId());

        noteItem.addAttribute("room_id", noteData.getRoomId());

        String jid = noteData.getJid();
        noteItem.addAttribute("ownjid", jid);

        noteItem.addAttribute("created_at", noteData.getCreatedAtStr());

        noteItem.addAttribute("updated_at", noteData.getUpdatedAtStr());

        return noteItem;
    }

}
