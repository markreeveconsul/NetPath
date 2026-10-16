import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewConfig} from './public/config-review.js';
import {forwardingChoices,routeCases} from './public/route-trainer.js';
import {gradeIncident,investigations} from './public/investigations.js';
import {validateToolAttempts} from './public/tool-records.js';
import {questions} from './public/questions.js';
import {selectBalanced,practiceDomain} from './public/assessment.js';
test('balanced session has exact domain proportions and unique question IDs',()=>{
 const selected=selectBalanced(questions);
 assert.equal(new Set(selected.map(q=>q.qid)).size,60);
 assert.deepEqual(['1','2','3','4','5'].map(d=>selected.filter(q=>practiceDomain(q)===d).length),[15,15,12,12,6]);
 assert.throws(()=>selectBalanced(questions.filter(q=>practiceDomain(q)!=='3')),/Domain 3/);
});
test('routing uses longest prefix, supports equal installed paths and unmatched destinations',()=>{
 assert.equal(forwardingChoices(routeCases[0].destination,routeCases[0].routes)[0].nextHop,'192.0.2.3');
 assert.equal(forwardingChoices(routeCases[3].destination,routeCases[3].routes).length,0);
 assert.equal(forwardingChoices(routeCases[5].destination,routeCases[5].routes).length,2);
 assert.equal(forwardingChoices('255.255.255.255',[{network:'255.255.255.255',prefix:32,nextHop:'x'}]).length,1);
 assert.throws(()=>forwardingChoices('256.1.1.1',[]));
 assert.throws(()=>forwardingChoices('10.1.1.1',[{network:'10.1.1.1',prefix:24}]));
});
test('config reviewer ties commands to interfaces rather than finding keywords',()=>{
 const correct='vlan 10\n name ENGINEERING\n!\ninterface FastEthernet0/1\n switchport mode access\n switchport access vlan 10\n!';
 assert.equal(reviewConfig('access',correct).score,4);
 const wrongPort=correct.replace('FastEthernet0/1','FastEthernet0/2');assert.equal(reviewConfig('access',wrongPort).score,1);
 assert.equal(reviewConfig('access',correct.replace('!\ninterface','!\ninterface').replace(' switchport mode access',' shutdown\n switchport mode access')).score,3);
 const relay='interface GigabitEthernet0/0\n ip address 192.168.60.1 255.255.255.0\n!\ninterface GigabitEthernet0/1\n ip helper-address 192.168.70.2\n!';assert.equal(reviewConfig('relay',relay).score,2);
 assert.throws(()=>reviewConfig('access','x'.repeat(100001)));
});
test('ACL review rejects shadowing and extra broad permits',()=>{
 const acl='ip access-list extended LAB-POLICY\n 10 permit ip host 192.168.10.10 any\n 20 deny ip 192.168.10.0 0.0.0.255 any\n 30 permit ip any any\n!\ninterface Gi0/0\n ip access-group LAB-POLICY in\n!';
 assert.equal(reviewConfig('acl',acl).score,2);
 assert.equal(reviewConfig('acl',acl.replace(' 10 permit',' permit ip any any\n 10 permit')).score,1);
 assert.equal(reviewConfig('acl',acl.replace('lab-policy in','lab-policy out').replace('LAB-POLICY in','LAB-POLICY out')).score,1);
});
test('incidents and persisted tool results have bounded valid references',()=>{
 for(const c of investigations){assert.equal(gradeIncident(c.id,c.answer).correct,true);assert.equal(gradeIncident(c.id,(c.answer+1)%3).correct,false);}
 assert.throws(()=>gradeIncident('missing',0));
 validateToolAttempts([{kind:'incidents',task:'mask',score:1,total:1,date:new Date().toISOString()}]);
 assert.throws(()=>validateToolAttempts([{kind:'configs',task:'acl',score:9,total:2,date:new Date().toISOString()}]));
 assert.throws(()=>validateToolAttempts([{kind:'routes',task:'missing',score:1,total:1,date:new Date().toISOString()}]));
});
